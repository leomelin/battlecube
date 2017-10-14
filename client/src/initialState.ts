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

export enum PlayerStatus {
  inactive,
  active
}

export interface IPlayer {
  name: string;
  url: string;
  status: PlayerStatus;
  color: string;
  position: {
    x: number | null,
    y: number | null,
    z: number | null
  };
}

export interface ISetup {
  setup: {
    edgeLength: number;
    speed: number;
    numOfTasksPerTick: number;
  };
  players: IPlayer[];
}

export interface ILogItem {
  name?: string;
  message: any;
  type?: MessageType;
  color: string;
}

export interface IAppState extends ISetup {
  sliderSpeedValue: number;
  gameStatus: GameStatus;
  error: any;
  log: ILogItem[];
  cube: any;
}

export default {
  sliderSpeedValue: 200,
  setup: {
    edgeLength: 8,
    speed: 200,
    numOfTasksPerTick: 1
  },
  players: [
    {
      name: 'John',
      url: 'http://localhost:4001',
      color: '#FF6767',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null }
    },
    {
      name: 'Petra',
      url: 'http://localhost:4002',
      color: '#EAEA00',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null }
    },
    {
      name: 'Carmine',
      url: 'http://localhost:4003',
      color: '#00FFFF',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null }
    },
    {
      name: 'Whoopie',
      url: 'http://localhost:4004',
      color: '#FF2EFF',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null }
    }
  ],
  gameStatus: GameStatus.stopped,
  error: null,
  log: [],
  cube: null
};
