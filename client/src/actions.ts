import {
  IAppState,
  IGameSetup,
  GameStatus,
  ILogItem,
  MessageType,
  PlayerStatus,
  IPlayer,
  IError,
  ErrorSeverity,
  Page
} from './initialState';
import socket, { ITickInfo } from './socket';
import { createCube } from './cube';
import { IBotFormActions } from './modules/botFormModule';
import { Actions } from 'hyperapp';
import marked from 'marked';

export const io = socket('http://localhost:9999');

const handleErrors = (res: any) => {
  if (!res.ok) throw Error(res.statusText);
  return res;
};

const DOCS_PATH = './docs.md';

const fetchMarkdown = () =>
  fetch(DOCS_PATH)
    .then(handleErrors)
    .then(data => data.text())
    .then(marked);

interface IStart {
  (state?: IAppState, actions?: IActions): void;
  [key: string]: any;
}

interface IUpdateSpeed {
  (state: IAppState, actions: IActions, speed: number): IAppState;
}

interface IShowNewSpeedWhileDragging {
  (state: IAppState, actions: IActions, sliderSpeedValue: number): IAppState;
  [key: string]: any;
}

interface ILog {
  InternalActions<State, IActions>(): IAppState;
  (): any;
}

interface IPersist {
  InternalActions<State, IActions>(): void;
  (): any;
}

export interface IActions extends Actions<IAppState> {
  togglerSpinner(state: IAppState): IAppState;
  changePage(page: Page): any;
  showNewSpeedWhileDragging: IShowNewSpeedWhileDragging;
  start: IStart;
  setup: {
    updateSpeed: IUpdateSpeed;
    up(data: { id: string, numOfPlayers?: number }): IGameSetup;
    down(data: { id: string, numOfPlayers?: number }): IGameSetup;
  };
  log: ILog;
  clearLog(): any;
  [key: string]: any;
  getPersistedState(): any;
  persistState: IPersist;
  removePersistedState(): any;
  botForm: IBotFormActions;
}

const cubeActions = {
  initCube: (state: IAppState) => {
    const cube = createCube();
    cube.init(state);
    return { cube };
  },
  updateCube: ({ cube, players, bombs, setup }: IAppState) => {
    cube.update({ players, bombs, setup });
  }
};

const playerActions = {
  addPlayer: (state: IAppState, _a: IActions, player: IPlayer) => {
    return { players: [...state.players, player] };
  },
  removePlayer: (state: IAppState, actions: IActions, index: number) => {
    const players = [
      ...state.players.slice(0, index),
      ...state.players.slice(index + 1)
    ];
    return { ...state, players };
  },

  recordWin: (state: IAppState, action: IActions, name: string) => (
    update: Function
  ) => {
    update((newState: IAppState) => {
      const players = state.players.map((p: IPlayer) => {
        const wins = p.name === name ? p.wins + 1 : p.wins;
        return { ...p, wins };
      });

      return { ...newState, players };
    });
  }
};

// see https://github.com/hyperapp/hyperapp/blob/master/docs/thunks.md for how hyperapp actions work

const NOTIFICATION_DURATION = 4000;

export default {
  ...cubeActions,
  ...playerActions,

  toggleSpinner: (state: IAppState) => ({ loading: !state.loading }),

  changePage: (state: IAppState, actions: IActions, page: Page) => async (update: Function) => {
    if (page === Page.docs) {
      update(actions.toggleSpinner());
      const docs = await fetchMarkdown();
      console.log(docs);
      update({ docs });
    }
    update({ currentPage: page });
  },

  showError: (
    state: IAppState,
    actions: IActions,
    { message, severity }: IError
  ) => (update: Function) => {
    update({ error: { message, severity } });
    setTimeout(update, NOTIFICATION_DURATION, { error: null });
  },

  showNewSpeedWhileDragging: (
    state: IAppState,
    actions: IActions,
    sliderSpeedValue: number
  ) => {
    const newState: IAppState = {
      ...state,
      sliderSpeedValue
    };
    return newState;
  },

  start: (state: IAppState, actions: IActions, data: any, emit: any) => {
    actions.clearLog();
    if (state.players.length < 2) {
      emit({
        name: 'error',
        data: {
          message: 'You must have al least two bots for a battle',
          severity: ErrorSeverity.warning
        }
      });
      return;
    }
    io.startGame({
      setup: state.setup,
      players: state.players.map(p => ({ name: p.name, url: p.url }))
    });
  },

  // set the amount of milliseconds delay you want between ticks
  // could add further config here
  setup: {
    updateSpeed: (state: IAppState, actions: IActions, speed: number) => {
      const newSetup = {
        ...state,
        speed
      };
      io.updateSetup(newSetup);
      return newSetup;
    },

    up: (
      state: IGameSetup,
      actions: IActions,
      { id }: any,
      emit: Function
    ) => {
      if (id === 'edgeLength') {
        emit({
          name: 'cube:resize',
          data: { edgeLength: state.edgeLength + 1 }
        });
      }
      return { [id]: state[id] + 1 };
    },

    down: (
      state: IGameSetup,
      actions: IActions,
      { id, numOfPlayers }: any,
      emit: Function
    ) => {
      if (state.edgeLength === 2 || numOfPlayers >= state.edgeLength + 1) {
        emit({
          name: 'error',
          data: {
            message: 'Your cube cannot be any smaller',
            severity: ErrorSeverity.warning
          }
        });
        return;
      }
      if (id === 'numOfTasksPerTick' && state[id] === 1) {
        return;
      }
      if (id === 'edgeLength') {
        emit({
          name: 'cube:resize',
          data: {
            ...state,
            ...{ edgeLength: state.edgeLength - 1 }
          }
        });
      }
      return { [id]: state[id] - 1 };
    }
  },

  updateGameStatus: (state: IAppState, { updateCube, recordWin }: IActions) => (
    update: Function
  ) => {
    io.onStart(() => update({ gameStatus: GameStatus.started }));

    io.onStop(async (finalInfo: any) => {
      await update((state: IAppState) => {
        const winner = finalInfo.winner
          ? `🏆 WINNER: ${finalInfo.winner.name}`
          : '👔 TIE.. No winner found.';

        const results = finalInfo.scores
          .sort((a: any, b: any) => b.highScore - a.highScore)
          .map((s: any) => `${s.name}: ${s.highScore}`)
          .join(', ');

        const scores = `RESULTS: ${results}`;

        const players = state.players.map((p: IPlayer): IPlayer => {
          if (finalInfo.winner && p.name === finalInfo.winner.name) {
            return { ...p, status: PlayerStatus.active };
          }
          return { ...p, status: PlayerStatus.inactive };
        });

        const log = [
          { name, message: { winner, scores }, type: MessageType.result },
          ...state.log
        ];
        return { ...state, players, log, gameStatus: GameStatus.stopped };
      });

      finalInfo.winner && recordWin(finalInfo.winner.name);
      updateCube();
    });
  },

  // every time a socket message is received the update function will add a message to the log
  log: (state: IAppState, { updateCube }: IActions) => (update: Function) => {
    io.onPlayerMove(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message }, ...state.log]
      }));
    });

    io.onPlantBomb(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message }, ...state.log]
      }));
    });

    io.onPlayerDoesNothing(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message }, ...state.log]
      }));
    });

    io.onPlayerLoses(async ({ name, message }: ILogItem) => {
      await update(({ players, log }: IAppState) => {
        const newLog = [{ name, message, type: MessageType.special }, ...log];
        const updatedPlayers = players.map((p: any) => {
          if (p.name === name) {
            return {
              ...p,
              position: { x: null, y: null, z: null },
              status: PlayerStatus.inactive
            };
          }
          return p;
        });
        return { log: newLog, players: updatedPlayers };
      });
    });

    io.onTick(async ({ players = [], gameInfo, items }: ITickInfo) => {
      await update((state: IAppState) => {
        const playerList = players.map((p: IPlayer) => p.name).join(', ');
        const currentPlayers = `Active players: ${playerList}`;
        const currentTick = `📍 TICK #${gameInfo.currentTick}`;
        const log = [
          { message: { currentPlayers, currentTick }, type: MessageType.tick },
          ...state.log
        ];

        const updatedPlayers = state.players.map((player: IPlayer) => {
          const { x = null, y = null, z = null } =
            players.find((p: IPlayer) => p.name === player.name) || {};
          const position = { x, y, z };
          return x !== null
            ? { ...player, position, status: PlayerStatus.active }
            : { ...player, position, status: PlayerStatus.inactive };
        });
        return { log, players: updatedPlayers, bombs: items };
      });

      updateCube();
    });
  },

  clearLog: () => ({ log: [] })
};
