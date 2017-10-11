import socketIO from 'socket.io-client';
import defaultConfig from './defaultConfig.json';

export interface ITickInfo {
  players: any[];
  gameInfo: any;
  items: any[];
}

interface ISocket {
  io: SocketIOClient.Socket;
  startGame(config?: object): void;
  updateSetup(setup: object): void;
  onStart(action: Function): void;
  onStop(action: Function): void;
  onPlayerMove(action: Function): void;
  onPlantBomb(action: Function): void;
  onPlayerDoesNothing(action: Function): void;
  onPlayerLoses(action: Function): void;
  onTick(action: Function): void;
}

export default (serverUrl: string): ISocket => {
  const io = socketIO(serverUrl);

  io.on('ERROR', (err: any) => {
    console.log('Error...', err);
  });

  // TODO: log errors
  return {
    io,
    startGame: config => io.emit('NEW_GAME', config || defaultConfig),
    updateSetup: setup => io.emit('GAME_SETUP_UPDATE', setup),
    onStart: action => io.on('GAME_STARTED', () => action()),
    onStop: action => io.on('GAME_ENDED', (scores: any) => action(scores)),
    onPlayerMove: action =>
      io.on('PLAYER_MOVE_ATTEMPT', ({ name, x, y, z }: any) => {
        action({ name, message: `tried to move to X: ${x} Y: ${y} Z: ${z}` });
      }),
    onPlantBomb: action =>
      io.on('PLAYER_PLACED_BOMB', ({ name, x, y, z }: any) => {
        action({ name, message: `placed a BOMB to X: ${x} Y: ${y} Z: ${z}` });
      }),
    onPlayerDoesNothing: action =>
      io.on('PLAYER_DID_NOTHING', ({ name, x, y, z }: any) => {
        action({
          name,
          message: `decided to sit tight and do nothing at X: ${x} Y: ${y} Z: ${z}`
        });
      }),
    onPlayerLoses: action =>
      io.on('PLAYER_LOST', ({ name, cause }: any) => {
        action({ name, message: `☠ ${cause}` });
      }),
    onTick: action =>
      io.on('NEXT_TICK', (info: ITickInfo) => {
        action(info);
      })
  };
};
