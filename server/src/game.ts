import {
  BotDirection, GameConfig, MoveOrder, NextTickInfo, PlayerPosition, PlayerSetup,
  PreValidationInfo
} from './models';
import {
  coordinateIsInUse, getDirectionsFromBot, getRandom3DCoordinate, isOutOfBounds,
  isSameCoordinate
} from './helpers';

export class Game {
  gameConfig: GameConfig;
  socket: any;
  playerPositions: PlayerPosition[] = [];
  gameStarted = false;
  edgeLength: number;
  numOfTasksPerTick: number;
  currentTick = 0;
  lostPlayers: PlayerSetup[] = [];
  gameEnded = false;
  preValidationInfo: PreValidationInfo = {
    players: [],
    collisions: [],
    outOfBoundsPlayers: []
  };

  constructor(gameConfig: GameConfig, socket: any) {
    this.gameConfig = gameConfig;
    this.edgeLength = gameConfig.setup.edgeLength;
    this.numOfTasksPerTick = gameConfig.setup.numOfTasksPerTick;
    this.socket = socket;
  }

  positionPlayers() {
    // Get custom positions only when game is started
    if (this.gameConfig.setup.playerStartPositions && !this.gameStarted) {
      this.playerPositions = this.gameConfig.setup.playerStartPositions;
      return;
    }

    this.playerPositions = this.gameConfig.players.map(({ name }) => {
      let coordinate = getRandom3DCoordinate(this.edgeLength - 1);

      while (coordinateIsInUse(coordinate, this.playerPositions)) {
        coordinate = getRandom3DCoordinate(this.edgeLength - 1);
      }

      return {
        name,
        ...coordinate
      };
    });

  }

  resetPreValidationInfo() {
    this.preValidationInfo = {
      players: [],
      collisions: [],
      outOfBoundsPlayers: []
    };
  }

  sendNextTickInfoToClient() {
    const nextTickInfo = new NextTickInfo();
    nextTickInfo.players = this.playerPositions;
    nextTickInfo.items = [];
    nextTickInfo.gameInfo = {
      edgeLength: this.edgeLength,
      numOfTasksPerTick: this.numOfTasksPerTick,
      numOfBotsInPlay: this.playerPositions.length,
      currentTick: this.currentTick
    };

    this.socket.emit('NEXT_TICK', nextTickInfo);
  }

  sendPlayerLostDueConnectionErrorInfo({ name }: PlayerSetup) {
    this.socket.emit('PLAYER_LOST', {
      name,
      cause: 'Connection error'
    });
  }

  moveBot(player: PlayerSetup, moveOrder: BotDirection) {
    const currentPlayerPosition: any = this.playerPositions.find(p => p.name === player.name);

    const [op, axis] = (<MoveOrder>moveOrder).direction.toLowerCase().split('');
    if (op === '+') {
      currentPlayerPosition[axis] = currentPlayerPosition[axis] + 1;
    } else {
      currentPlayerPosition[axis] = currentPlayerPosition[axis] - 1;
    }

    // filter out out of bounds player
    if (isOutOfBounds(currentPlayerPosition, this.edgeLength)) {
      this.preValidationInfo.outOfBoundsPlayers.push(player);
    }
  }

  applyBotDirections(player: PlayerSetup, directions: BotDirection[]) {
    directions.forEach((direction) => {
      if (direction.task === 'MOVE') {
        this.moveBot(player, direction);
      }
    });
  }

  async fetchNewDirectionFromBots() {
    for (const player of this.playerPositions) {
      const playerSetup = <PlayerSetup>this.gameConfig.players.find(p => p.name === player.name);
      try {
        const directions = await getDirectionsFromBot(playerSetup);
        this.applyBotDirections(playerSetup, directions);
      } catch (e) {
        this.sendPlayerLostDueConnectionErrorInfo(playerSetup);
        this.lostPlayers.push(playerSetup);
      }
    }

    // Check for collisions
    [...this.playerPositions].forEach((player, i) => {
      const otherPlayers = this.playerPositions.filter((p, i2) => i2 !== i);
      if (coordinateIsInUse(player, otherPlayers)) {
        this.playerPositions = this.playerPositions.filter(p => p.name !== player.name);
        const foundCollisionInfo = this.preValidationInfo.collisions.find(i => isSameCoordinate(i, player));

        if (foundCollisionInfo) {
          foundCollisionInfo.players.push(player);
        } else {
          const { x, y, z } = player;
          this.preValidationInfo.collisions.push({
            x,
            y,
            z,
            hasBomb: false, // TODO: bomb info & bomb check
            players: [player]
          });
        }
      }
    });

    // Filter out connections lost
    this.lostPlayers.forEach((player) => {
      this.playerPositions = this.playerPositions.filter(p => p.name !== player.name);
    });

    // Filter out ones out of bounds
    this.preValidationInfo.outOfBoundsPlayers.forEach((player) => {
      this.playerPositions = this.playerPositions.filter(p => p.name !== player.name);
    });

    // All remaining players are added here
    this.preValidationInfo.players = [...this.playerPositions];
  }

  statusCheck() {
    this.preValidationInfo.outOfBoundsPlayers.forEach(({ name }) => {
      this.socket.emit('PLAYER_LOST', {
        name,
        cause: 'Player moved out of bounds'
      });
    });

    this.preValidationInfo.collisions.forEach((collision) => {
      collision.players.forEach(({ name }) => {
        this.socket.emit('PLAYER_LOST', {
          name,
          cause: collision.hasBomb ? 'Player stepped on a BOMB' : 'Player crashed to other player'
        });
      });
    });

    if (this.lostPlayers.length === this.gameConfig.players.length || this.preValidationInfo.players.length === 1) {
      this.gameEnded = true;
    } else {
      this.resetPreValidationInfo();
    }
  }

  getHighscores() {
    // TODO: generate high scores
    return { winner: this.preValidationInfo.players };
  }

  async start() {
    this.positionPlayers();
    this.socket.emit('GAME_STARTED');
    this.gameStarted = true;
    while (!this.gameEnded) {
      this.sendNextTickInfoToClient();
      await this.fetchNewDirectionFromBots();
      this.statusCheck();
      this.currentTick = this.currentTick + 1;
    }

    this.socket.emit('GAME_ENDED', this.getHighscores());
  }
}
