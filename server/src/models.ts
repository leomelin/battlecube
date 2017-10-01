export type Direction = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

export class Coordinate {
  x: number;
  y: number;
  z: number;
}

export class PlayerPosition extends Coordinate {
  name: string;
}

export class GameSetup {
  edgeLength: number;
  speed: number = 0;
  numOfTasksPerTick: number;
  playerStartPositions?: PlayerPosition[];
}

export class HighScoreInfo {
  result: 'TIE'|'WINNER_FOUND';
  winner?: PlayerWithHighScore;
  scores: PlayerWithHighScore[];
};

export class PlayerSetup {
  name: string;
  url: string;
}

export class PlayerWithHighScore extends PlayerSetup {
  highScore: number;
}

export class GameConfig {
  setup: GameSetup;
  players: PlayerSetup[];
}

export type ItemType = 'BOMB';

export class GameItem extends Coordinate {
  type: ItemType;
}

export class GameInfo {
  edgeLength: number;
  numOfTasksPerTick: number;
  numOfBotsInPlay: number;
  currentTick: number;
}

export class NextTickInfo {
  gameInfo: GameInfo;
  players: PlayerPosition[];
  items: GameItem[];

  constructor(nextTickInfo: NextTickInfo) {
    this.gameInfo = nextTickInfo.gameInfo;
    this.players = nextTickInfo.players;
    this.items = nextTickInfo.items;
  }
}

export class BotOrder {
  task: 'MOVE' | 'BOMB' | 'NOOP';
}

export class MoveOrder extends BotOrder {
  direction: Direction;
}

export class PlaceBombOrder extends BotOrder {
  x: number;
  y: number;
  z: number;
}

export class NoopOrder {
  task: 'NOOP';
}

export type BotDirection = MoveOrder | PlaceBombOrder | NoopOrder;

export class CollisionInfo extends Coordinate {
  hasBomb: boolean;
  players: PlayerPosition[];
}

export class PreValidationInfo {
  outOfBoundsPlayers: PlayerSetup[];
  collisions: CollisionInfo[];
  players: PlayerPosition[];
}

export class NextTickInfoForBot extends NextTickInfo {
  currentPlayer: PlayerSetup;
}
