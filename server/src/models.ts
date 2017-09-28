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
  speed?: number = 0;
  numOfTasksPerTick: number;
  playerStartPositions?: PlayerPosition[];
}

export class PlayerSetup {
  name: string;
  url: string;
}

export class GameConfig {
  setup: GameSetup;
  players: PlayerSetup[];
}

export class GameItem extends Coordinate {
  type: 'BOMB';
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
}
