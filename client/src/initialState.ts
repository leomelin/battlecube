interface IPlayer {
  name: string;
  url: string;
}

export interface ISetup {
  setup: {
    edgeLength: number;
    speed: number;
    numOfTasksPerTick: number;
  };
  players: IPlayer[];
}

export enum GameStatus {
  started,
  stopped
}

export enum MessageType {
  normal,
  special,
  tick,
  result
}

export interface ILogItem {
  name?: string;
  message: any;
  type?: MessageType;
}

export interface IAppState extends ISetup {
  gameStatus: GameStatus;
  error: any;
  log: ILogItem[];
}

export default {
  setup: {
    edgeLength: 8,
    speed: 200,
    numOfTasksPerTick: 1
  },
  players: [
    {
      name: 'John',
      url: 'http://localhost:4001'
    },
    {
      name: 'Petra',
      url: 'http://localhost:4002'
    },
    {
      name: 'Carmine',
      url: 'http://localhost:4003'
    },
    {
      name: 'Whoopie',
      url: 'http://localhost:4004'
    }
  ],
  gameStatus: GameStatus.stopped,
  error: null,
  log: []
};
