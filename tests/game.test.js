const Game = require('../build/server/src/game').Game;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockSocket = (func) => ({
  emit: (event, data) => {
    return func(JSON.parse(JSON.stringify({ event, data })));
  }
});

describe('test game logic', () => {
  test('should construct game object', () => {
    const game = new Game({
      'setup': {
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 1
      },
      'players': [
        {
          'name': 'John',
          'url': 'http://localhost:4001'
        },
        {
          'name': 'Petra',
          'url': 'http://localhost:4002'
        },
        {
          'name': 'Carmine',
          'url': 'http://localhost:4003'
        },
        {
          'name': 'Whoopie',
          'url': 'http://localhost:4004'
        }
      ]
    }, createMockSocket(() => {
    }));

    // Construction was successful
    expect(game.playerPositions.length).toBe(0);
  });

  test('should run game and make bot lose by moving out of bounds', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };
    const game = new Game({
      'setup': {
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 1,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return [{
              task: 'MOVE',
              direction: '-X'
            }];
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList.length).toBe(5);
    expect(eventsList[0].event).toBe('GAME_STARTED');
    expect(eventsList[1].event).toBe('NEXT_TICK');
    expect(eventsList[2].event).toBe('PLAYER_MOVE_ATTEMPT');
    expect(eventsList[3].event).toBe('PLAYER_LOST');
    expect(eventsList[3].data).toMatchObject({
      name: 'John',
      cause: 'Player moved out of bounds'
    });
    expect(eventsList[4].event).toBe('GAME_ENDED');
    expect(eventsList[1].data.players[0].x).toBe(0);
    expect(eventsList[1].data.players[0].y).toBe(0);
    expect(eventsList[1].data.players[0].z).toBe(0);

  });

  test('should run game and make bot lose by stepping on a bomb', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };
    const game = new Game({
      'setup': {
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 1,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return [{
              task: 'BOMB',
              x: 0,
              y: 0,
              z: 0
            }];
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList.length).toBe(5);
    expect(eventsList[0].event).toBe('GAME_STARTED');
    expect(eventsList[1].event).toBe('NEXT_TICK');
    expect(eventsList[2].event).toBe('PLAYER_PLACED_BOMB');
    expect(eventsList[3].event).toBe('PLAYER_LOST');
    expect(eventsList[3].data).toMatchObject({
      name: 'John',
      cause: 'Player stepped on a BOMB'
    });
    expect(eventsList[4].event).toBe('GAME_ENDED');
  });

  test('should make bot lose on giving too many directions', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };
    const game = new Game({
      'setup': {
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 1,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return [{
              task: 'MOVE',
              direction: '+X'
            }, {
              task: 'BOMB',
              x: 0,
              y: 0,
              z: 0
            }];
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList.length).toBe(4);
    expect(eventsList[0].event).toBe('GAME_STARTED');
    expect(eventsList[1].event).toBe('NEXT_TICK');
    expect(eventsList[2].event).toBe('PLAYER_LOST');
    expect(eventsList[2].data).toMatchObject({
      name: 'John',
      cause: { 'details': 'Invalid amount of directions sent', 'error': 'VALIDATION_ERROR' }
    });
    expect(eventsList[3].event).toBe('GAME_ENDED');
  });
});


