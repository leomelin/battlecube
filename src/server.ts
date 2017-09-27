import * as socketIO from 'socket.io';

const io = socketIO(9999);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

io.on('connection', (socket) => {
  console.log('user connected', socket.id);

  socket.on('NEW_GAME', async (data) => {
    console.log('new game with data', data);

    await wait(10000);
    socket.emit('GAME_STARTED', { foo: 'bar' });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

