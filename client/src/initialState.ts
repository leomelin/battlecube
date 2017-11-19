import { IBotFormState } from './modules/botFormModule';
import { State } from 'hyperapp';

export enum GameStatus {
  started,
  stopped
}

export enum MessageType {
  special,
  tick,
  result
}

export enum PlayerStatus {
  inactive,
  active
}

export interface IPlayer extends State {
  name: string;
  url: string;
  status: PlayerStatus;
  color: string;
  position: {
    x: number | null,
    y: number | null,
    z: number | null
  };
  wins: number;
  score: number;
}

export interface IGameSetup {
  maxNumOfTicks: number;
  edgeLength: number;
  speed: number;
  numOfTasksPerTick: number;
  [key: string]: number;
}

export interface ISetup extends State {
  setup: IGameSetup;
  players: IPlayer[];
}

export interface IPosition {
  x: number;
  y: number;
  z: number;
}

export interface IBomb extends IPosition {
  type: string;
}

export enum ErrorSeverity {
  warning,
  error
}

export interface IError {
  message: string;
  severity: ErrorSeverity;
}

export interface ILogItem {
  name?: string;
  message: any;
  type?: MessageType;
  color: string;
  position?: IPosition;
  items: IBomb;
}

export enum Page {
  singleBattle,
  multipleBattle,
  docs
}

export interface IAppState extends ISetup {
  loading: boolean;
  currentPage: Page;
  sliderSpeedValue: number;
  gameStatus: GameStatus;
  error: IError | null;
  log: ILogItem[];
  cube: any;
  scorePlot: any;
  botForm: IBotFormState;
  bombs: IBomb[];
  remainingGames: number;
  docs: string;
  batch: any[];
  [key: string]: any;
}

export default {
  loading: false,
  currentPage: Page.singleBattle,
  sliderSpeedValue: 200,
  setup: {
    maxNumOfTicks: 1000,
    edgeLength: 8,
    speed: 200,
    numOfTasksPerTick: 4
  },
  players: [
    {
      name: 'Teebot 1',
      url: 'https://us-central1-battlecube-teebot.cloudfunctions.net/teebot',
      color: '#FF6767',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null },
      wins: 0,
      score: 0
    },
    {
      name: 'Teebot 2',
      url: 'https://us-central1-battlecube-teebot.cloudfunctions.net/teebot',
      color: '#EAEA00',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null },
      wins: 0,
      score: 0
    },
    {
      name: 'Teebot 3',
      url: 'https://us-central1-battlecube-teebot.cloudfunctions.net/teebot',
      color: '#00FFFF',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null },
      wins: 0,
      score: 0
    },
    {
      name: 'Teebot 4',
      url: 'https://us-central1-battlecube-teebot.cloudfunctions.net/teebot',
      color: '#FF2EFF',
      status: PlayerStatus.inactive,
      position: { x: null, y: null, z: null },
      wins: 0,
      score: 0
    }
  ],
  bombs: [],
  gameStatus: GameStatus.stopped,
  remainingGames: 0,
  error: null,
  log: [],
  cube: null,
  scorePlot: null,
  docs: ''
};
