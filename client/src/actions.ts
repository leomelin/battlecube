import {
  ISetup,
  IAppState,
  GameStatus,
  ILogItem,
  MessageType
} from './initialState';
import socket, { ITickInfo } from './socket';
export const io = socket('http://localhost:9999');

interface IStart {
  (source: string, subString: string): object;
  (): void;
}

interface IUpdateSpeed {
  (state: IAppState, actions: IActions): Function;
  (speed: number): object;
}

export interface IActions {
  start: IStart;
  setup: {
    updateSpeed: IUpdateSpeed;
  };
  log(): any;
  clearLog(): any;
}

// see https://github.com/hyperapp/hyperapp/blob/master/docs/thunks.md for how hyperapp actions work

export default {
  start: (state: IAppState, actions: IActions) => {
    actions.clearLog();
    io.startGame({ setup: state.setup, players: state.players });
  },

  // set the amount of milliseconds delay you want between ticks
  // could add further config here
  setup: {
    updateSpeed: (state: IAppState, actions: IActions, speed: number) => ({
      speed,
      ...state.setup
    })
  },

  updateGameStatus: () => (update: Function) => {
    io.onStart(() => update({ gameStatus: GameStatus.started }));
    io.onStop((finalInfo: any) => {
      update((state: IAppState) => {
        const winner = `🏆 WINNER: ${finalInfo.winner.name}`;
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
    });
    io.onTick(({ players = [], gameInfo }: ITickInfo) => {
      update((state: IAppState) => {
        const playerList = players.map(p => p.name).join(', ');
        const currentPlayers = `Active players: ${playerList}`;
        const currentTick = `📍 TICK #${gameInfo.currentTick}`;
        const log = [
          { message: { currentPlayers, currentTick }, type: MessageType.tick },
          ...state.log
        ];
        return { log };
      });
    });
  },

  clearLog: () => ({ log: [] })
};
