import * as socketIO from 'socket.io';
import { getValidatedGameConfig, getValidatedGameSetup } from './validators';
import { Game } from './game';

const io = socketIO(process.env.SERVER_PORT || 9999);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

io.on('connection', (socket) => {
  console.log('User connected', socket.id);
  let game: Game;

  socket.on('GAME_SETUP_UPDATE', async (payload: any) => {
    const gameSetup = getValidatedGameSetup(payload, socket);
    if (!gameSetup || !game) {
      return;
    }

    game.updateGameSetup(gameSetup);
  });

  socket.on('NEW_GAME', async (payload: any) => {
    const gameConfig = getValidatedGameConfig(payload, socket);
    if (!gameConfig) {
      return;
    }

    game = new Game(gameConfig, socket);
    game.start();
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});
