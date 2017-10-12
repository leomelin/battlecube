import {
  ISetup,
  IAppState,
  GameStatus,
  ILogItem,
  MessageType,
  PlayerStatus
} from './initialState';
import socket, { ITickInfo } from './socket';
import { createCube } from './createCube';

export const io = socket('http://localhost:9999');

interface IStart {
  (state?: IAppState, actions?: IActions): void;
  [key: string]: any;
}

interface IUpdateSpeed {
  (state: IAppState, actions: IActions, speed: number): IAppState;
  [key: string]: any;
}

interface IShowNewSpeedWhileDragging {
  (state: IAppState, actions: IActions, sliderSpeedValue: number): IAppState;
  [key: string]: any;
}

export interface IActions {
  showNewSpeedWhileDragging: IShowNewSpeedWhileDragging;
  start: IStart;
  setup: {
    updateSpeed: IUpdateSpeed;
  };
  log(): any;
  clearLog(): any;
  [key: string]: any;
}

// see https://github.com/hyperapp/hyperapp/blob/master/docs/thunks.md for how hyperapp actions work

export default <IActions>{
  showNewSpeedWhileDragging: (state: IAppState, actions: IActions, sliderSpeedValue: number) => {
    const newState: IAppState = {
      ...state,
      sliderSpeedValue
    };

    return newState;
  },
  initCube: (state: IAppState) => {
    const cube = createCube();
    cube.init(state);
    return { cube };
  },
  updateCube: (state: IAppState) => {
    state.cube.run(state);
  },
  start: (state: IAppState, actions: IActions) => {
    actions.clearLog();
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
    }
  },

  updateGameStatus: () => (update: Function) => {
    io.onStart(() => update({ gameStatus: GameStatus.started }));
    io.onStop((finalInfo: any) => {
      update((state: IAppState) => {
        const winner = finalInfo.winner ? `🏆 WINNER: ${finalInfo.winner.name}` : 'Error occurred';
        const results = finalInfo.scores
          .sort((a: any, b: any) => b.highScore - a.highScore)
          .map((s: any) => `${s.name}: ${s.highScore}`)
          .join(', ');
        const scores = `RESULTS: ${results}`;
        const log = [
          { name, message: { winner, scores }, type: MessageType.result },
          ...state.log
        ];
        return { ...state, log, gameStatus: GameStatus.stopped };
      });
    });
  },

  // every time a socket message is received the update function will add a message to the log
  log: () => (update: Function) => {
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
    io.onPlayerLoses(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message, type: MessageType.special }, ...state.log]
      }));
      update(({ setup, players, log, cube }: IAppState) => {
        const newLog =  [{ name, message, type: MessageType.special }, ...log];
        const updatedPlayers = players.map((p: any) => {
          if (p.name === name) {
            return { ...p, position: { x: null, y: null, z: null },  gameStatus: GameStatus.stopped };
          }
          return p;
        });

        cube.run({ setup, players: updatedPlayers });
        return { log: newLog, players: updatedPlayers };
      });
    });
    io.onTick(({ players = [], gameInfo }: ITickInfo, actions: any) => {
      update((state: IAppState) => {
        const playerList = players.map(p => p.name).join(', ');
        const currentPlayers = `Active players: ${playerList}`;
        const currentTick = `📍 TICK #${gameInfo.currentTick}`;
        const log = [
          { message: { currentPlayers, currentTick }, type: MessageType.tick },
          ...state.log
        ];
        const updatedPlayers = state.players.map((player) => {
          const { x = null, y = null, z = null } = players.find(p => p.name === player.name) || {};
          const position = { x, y, z };
          return x !== null ? { ...player, position, status: PlayerStatus.active }
          : { ...player, position, status: PlayerStatus.inactive };
        });

        state.cube.run({ setup: state.setup, players: updatedPlayers });
        return { log, players: updatedPlayers };
      });
    });
  },

  clearLog: () => ({ log: [] })
};
