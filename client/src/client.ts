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

io.on('PLAYER_LOST', (info: any) => {
  console.log('Player lost', info);
});

io.on('GAME_ENDED', (scores: any) => {
  console.log('Game has ended! Highscores: ', scores);
});

io.on('ERROR', (err: any) => {
  console.log('Error...', err);
});
