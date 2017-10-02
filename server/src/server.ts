import * as socketIO from 'socket.io';
import { getValidatedGameConfig } from './validators';
import { Game } from './game';

const io = socketIO(process.env.SERVER_PORT || 9999);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

io.on('connection', (socket) => {
  console.log('User connected', socket.id);

  socket.on('NEW_GAME', async (payload: any) => {
    const gameConfig = getValidatedGameConfig(payload, socket);
    if (!gameConfig) {
      return;
    }

    const game = new Game(gameConfig, socket);
    game.start();
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});
