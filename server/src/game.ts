import { GameConfig, NextTickInfo, PlayerPosition, PlayerSetup } from './models';
import { coordinateIsInUse, getDirectionsFromBot, getRandom3DCoordinate } from './helpers';

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

  async fetchNewDirectionFromBots() {
    for (const player of this.gameConfig.players) {
      try {
        const directions = await getDirectionsFromBot(player);
        // TODO apply directions
      } catch (e) {
        this.sendPlayerLostDueConnectionErrorInfo(player);
        this.lostPlayers.push(player);
        this.playerPositions = this.playerPositions.filter(p => p.name !== player.name);
      }
    }
  }

  statusCheck() {
    if (this.lostPlayers.length === this.gameConfig.players.length) {
      this.gameEnded = true;
    }
    // TODO: check collisions etc
  }

  getHighscores() {
    // TODO: generate high scores
    return { scores: [] };
  }

  async start() {
    this.positionPlayers();
    this.socket.emit('GAME_STARTED');
    this.gameStarted = true;
    while (!this.gameEnded) {
      this.sendNextTickInfoToClient();
      await this.fetchNewDirectionFromBots();
      this.statusCheck();
    }

    this.socket.emit('GAME_ENDED', this.getHighscores());
  }
}
