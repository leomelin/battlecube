import * as socketIO from 'socket.io-client';

const io = socketIO('http://localhost:9999');

io.emit('NEW_GAME', {
  cool: 'stuff'
});

io.on('GAME_STARTED', (data: any) => {
  console.log('received game started event');
});
