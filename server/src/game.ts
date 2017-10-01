import {
  BotDirection, CollisionInfo, GameConfig, ItemType, PlayerWithHighScore, MoveOrder, NextTickInfo, PlaceBombOrder,
  PlayerPosition,
  PlayerSetup,
  PreValidationInfo, HighScoreInfo, GameItem
} from './models';
import {
  coordinateIsInUse, getDirectionsFromBot, getRandom3DCoordinate, isOutOfBounds,
  isSameCoordinate, wait
} from './helpers';
import { getValidatedBotDirections } from './validators';

export class Game {
  socket: any;
  gameConfig: GameConfig;
  playerPositions: PlayerPosition[] = [];
  gameStarted = false;
  edgeLength: number;
  numOfTasksPerTick: number;
  otherItems: GameItem[] = [];

  currentTick = 0;
  lostPlayers: PlayerWithHighScore[] = [];
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

  getNextTickInfo() {
    return new NextTickInfo({
      players: this.playerPositions,
      items: this.otherItems,
      gameInfo: {
        edgeLength: this.edgeLength,
        numOfTasksPerTick: this.numOfTasksPerTick,
        numOfBotsInPlay: this.playerPositions.length,
        currentTick: this.currentTick
      }
    });
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

    this.socket.emit('PLAYER_MOVE_ATTEMPT', currentPlayerPosition);

    // push out of bounds player to lostPlayers array
    if (isOutOfBounds(currentPlayerPosition, this.edgeLength)) {
      if (!this.lostPlayers.find(p => p.name === player.name)) this.lostPlayers.push({
        ...player,
        highScore: this.currentTick
      });
    }
  }

  placeBomb(player: PlayerSetup, bombOrder: BotDirection) {
    const { x, y, z } = <PlaceBombOrder>bombOrder;
    const collision = this.preValidationInfo.collisions.find(collision => isSameCoordinate(collision, <PlaceBombOrder>bombOrder));
    if (collision) {
      collision.hasBomb = true;
    } else {
      this.otherItems.push({
        x,
        y,
        z,
        type: <ItemType>'BOMB'
      });
    }

    this.socket.emit('PLAYER_PLACED_BOMB', {
      x,
      y,
      z,
      name: player.name
    });
  }

  noopPlayer(player: PlayerSetup, noopOrder: BotDirection) {
    const { x, y, z } = <PlayerPosition>this.playerPositions.find(p => p.name === player.name);
    this.socket.emit('PLAYER_DID_NOTHING', {
      x,
      y,
      z,
      name: player.name
    });
    // Do nothing.
  }

  applyBotDirections(player: PlayerSetup, directions: BotDirection[]) {
    directions.forEach((direction) => {
      if (direction.task === 'MOVE') {
        this.moveBot(player, direction);
      } else if (direction.task === 'BOMB') {
        this.placeBomb(player, direction);
      } else if (direction.task === 'NOOP') {
        this.noopPlayer(player, direction);
      }
    });
  }

  async fetchNewDirectionFromBots(nextTickInfo: NextTickInfo) {
    for (const player of this.playerPositions) {
      const playerSetup = <PlayerSetup>this.gameConfig.players.find(p => p.name === player.name);
      try {
        const payload = await getDirectionsFromBot({
          currentPlayer: playerSetup,
          ...nextTickInfo
        });

        const directions = getValidatedBotDirections(payload);

        if (!directions) {
          // TODO: Set player lost when directions are not correct!
        }
        this.applyBotDirections(playerSetup, directions);
      } catch (e) {
        this.sendPlayerLostDueConnectionErrorInfo(playerSetup);
        if (!this.lostPlayers.find(p => p.name === player.name)) this.lostPlayers.push({
          ...playerSetup,
          highScore: this.currentTick
        });
      }
    }

    // Check for collisions
    this.playerPositions.forEach((player: PlayerPosition, i: number) => {
      const otherPlayers = this.playerPositions.filter((p, i2) => i2 !== i);
      const bombs = this.otherItems.filter(item => item.type === 'BOMB');
      const hasBomb = coordinateIsInUse(player, bombs);
      if (coordinateIsInUse(player, otherPlayers) || hasBomb) {
        const foundCollisionInfo = this.preValidationInfo.collisions.find(info => isSameCoordinate(info, player));

        if (foundCollisionInfo) {
          if (!foundCollisionInfo.players.find(p => p.name === player.name)) foundCollisionInfo.players.push(player);
        } else {
          const { x, y, z } = player;
          this.preValidationInfo.collisions.push({
            x,
            y,
            z,
            hasBomb,
            players: [player]
          });
        }
      }
    });

    // Filter out collisioned players
    this.preValidationInfo.collisions.forEach((collision) => {
      collision.players.forEach((player) => {
        this.playerPositions = this.playerPositions.filter(p => p.name !== player.name);
      });
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
    this.preValidationInfo.outOfBoundsPlayers.forEach((player) => {
      this.socket.emit('PLAYER_LOST', {
        name: player.name,
        cause: 'Player moved out of bounds'
      });
      if (!this.lostPlayers.find(p => p.name === player.name)) this.lostPlayers.push({
        ...player,
        highScore: this.currentTick
      });
    });

    this.preValidationInfo.collisions.forEach((collision) => {
      collision.players.forEach((player) => {
        this.socket.emit('PLAYER_LOST', {
          name: player.name,
          cause: collision.hasBomb ? 'Player stepped on a BOMB' : 'Player crashed to other player'
        });
        const playerSetup = <PlayerSetup>this.gameConfig.players.find(p => p.name === player.name);
        if (!this.lostPlayers.find(p => p.name === player.name)) this.lostPlayers.push({
          ...playerSetup,
          highScore: this.currentTick
        });
      });
    });

    if (this.lostPlayers.length === this.gameConfig.players.length || this.preValidationInfo.players.length === 1) {
      this.gameEnded = true;
    }
  }

  getHighscores(): HighScoreInfo {
    let winner;
    const scores = this.lostPlayers;
    if (this.playerPositions.length) {
      winner = {
        ...(<PlayerSetup>this.gameConfig.players.find(p => p.name === this.playerPositions[0].name)),
        highScore: this.currentTick
      };
      scores.push(winner);
    }

    return {
      winner,
      scores,
      result: winner ? 'WINNER_FOUND' : 'TIE'
    };
  }

  removeExplodedBombs() {
    this.otherItems = this.otherItems.filter((item) => {
      if (item.type !== 'BOMB') {
        return item;
      }

      if (!coordinateIsInUse(item, this.preValidationInfo.collisions.filter(collision => collision.hasBomb))) {
        return item;
      }
    });
  }

  async start() {
    this.positionPlayers();
    this.socket.emit('GAME_STARTED');
    this.gameStarted = true;
    this.preValidationInfo.collisions = [];
    this.otherItems = [];
    while (!this.gameEnded) {
      const nextTickInfo = this.getNextTickInfo();
      this.removeExplodedBombs();
      this.resetPreValidationInfo();
      this.socket.emit('NEXT_TICK', nextTickInfo);
      await this.fetchNewDirectionFromBots(nextTickInfo);
      this.statusCheck();
      this.currentTick = this.currentTick + 1;
      await wait(this.gameConfig.setup.speed);
    }

    this.socket.emit('GAME_ENDED', this.getHighscores());
  }
}
