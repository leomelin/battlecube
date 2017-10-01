import * as socketIO from 'socket.io-client';
import * as defaultConfig from './defaultConfig.json';

const io = socketIO('http://localhost:9999');

io.emit('NEW_GAME', defaultConfig);

io.on('GAME_STARTED', () => {
  console.log('Game started!');
});

io.on('NEXT_TICK', (nextTickInfo: any) => {
  console.log('Next tick: ', nextTickInfo);
});

io.on('PLAYER_MOVE_ATTEMPT', ({ name, x, y, z }: any) => {
  console.log(`${name} tried to move to X: ${x} Y: ${y} Z: ${z}`);
});

io.on('PLAYER_PLACED_BOMB', ({ name, x, y, z }: any) => {
  console.log(`${name} placed a BOMB to X: ${x} Y: ${y} Z: ${z}`);
});

io.on('PLAYER_DID_NOTHING', ({ name, x, y, z }: any) => {
  console.log(`${name} decided to sit tight and do nothing at X: ${x} Y: ${y} Z: ${z}`);
});

io.on('PLAYER_LOST', (info: any) => {
  console.log('Player lost', info);
});

io.on('GAME_ENDED', (scores: any) => {
  console.log('Game has ended! Highscores: ', scores);
});

io.on('ERROR', (err: any) => {
  console.log('Error...', err);
});
