const getValidatedGameConfig = require('../build/server/src/validators').getValidatedGameConfig;

const Game = require('../build/server/src/game').Game;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockSocket = (func) => ({
  id: 'mock-socket-id',
  emit: (event, data) => {
    return func(JSON.parse(JSON.stringify({ event, data })));
  }
});

describe('test game config validation', () => {
  test('should fail when no max num of ticks set', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    const gameConfig = getValidatedGameConfig({
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
        }]
    }, createMockSocket(socket));
    expect(gameConfig).toBeNull();
    expect(eventsList.length).toBe(1);
    expect(eventsList[0].data.error).toBe('INVALID_GAME_CONFIGURATION');
  });

  test('should fail when edgelength is too small for all players to fit inside the cube', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    const gameConfig = getValidatedGameConfig({
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 2,
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
          'name': 'Dickson',
          'url': 'http://localhost:4005'
        },
        {
          'name': 'Dickson2',
          'url': 'http://localhost:4006'
        },
        {
          'name': 'Dickson3',
          'url': 'http://localhost:4007'
        },
        {
          'name': 'Dickson4',
          'url': 'http://localhost:4008'
        },
        {
          'name': 'Dickson5',
          'url': 'http://localhost:4009'
        },
        {
          'name': 'Whoopie',
          'url': 'http://localhost:4004'
        }]
    }, createMockSocket(socket));
    expect(gameConfig).toBeNull();
    expect(eventsList.length).toBe(1);
    expect(eventsList[0].data.error).toBe('INVALID_GAME_CONFIGURATION');
  });

  test('should fail when multiple players have same name', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    const gameConfig = getValidatedGameConfig({
      'setup': {
        'maxNumOfTicks': 200,
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
          'name': 'John',
          'url': 'http://localhost:4002'
        },
        {
          'name': 'Carmine',
          'url': 'http://localhost:4003'
        },
        {
          'name': 'Whoopie',
          'url': 'http://localhost:4004'
        }]
    }, createMockSocket(socket));
    expect(gameConfig).toBeNull();
    expect(eventsList.length).toBe(1);
    expect(eventsList[0].data.error).toBe('INVALID_GAME_CONFIGURATION');
  });

  test('should fail when speed is negative', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    const gameConfig = getValidatedGameConfig({
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 8,
        'speed': -1,
        'numOfTasksPerTick': 1
      },
      'players': [
        {
          'name': 'John',
          'url': 'http://localhost:4001'
        },
        {
          'name': 'Paul',
          'url': 'http://localhost:4002'
        },
        {
          'name': 'Carmine',
          'url': 'http://localhost:4003'
        },
        {
          'name': 'Whoopie',
          'url': 'http://localhost:4004'
        }]
    }, createMockSocket(socket));
    expect(gameConfig).toBeNull();
    expect(eventsList.length).toBe(1);
    expect(eventsList[0].data.error).toBe('INVALID_GAME_CONFIGURATION');
  });

  test('should fail when numOfTasksPerTick is zero', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    const gameConfig = getValidatedGameConfig({
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 0
      },
      'players': [
        {
          'name': 'John',
          'url': 'http://localhost:4001'
        },
        {
          'name': 'Paul',
          'url': 'http://localhost:4002'
        },
        {
          'name': 'Carmine',
          'url': 'http://localhost:4003'
        },
        {
          'name': 'Whoopie',
          'url': 'http://localhost:4004'
        }]
    }, createMockSocket(socket));
    expect(gameConfig).toBeNull();
    expect(eventsList.length).toBe(1);
    expect(eventsList[0].data.error).toBe('INVALID_GAME_CONFIGURATION');
  });
});

describe('test game logic', () => {
  test('should construct game object', () => {
    const game = new Game({
      'setup': {
        'maxNumOfTicks': 200,
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
        'maxNumOfTicks': 200,
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

    expect(eventsList[4].data.result).toBe('TIE');
  });

  test('should run game and make bot lose by stepping on a bomb', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };
    const game = new Game({
      'setup': {
        'maxNumOfTicks': 200,
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
    expect(eventsList[4].data.result).toBe('TIE');
  });

  test('should make bot lose on giving too many directions', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };
    const game = new Game({
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 1,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          },
          {
            'name': 'Paul',
            'x': 2,
            'y': 3,
            'z': 4
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
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            return [{
              task: 'MOVE',
              direction: '+X'
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
    expect(eventsList[2].event).toBe('PLAYER_LOST');
    expect(eventsList[2].data).toMatchObject({
      name: 'John',
      cause: { 'details': 'Invalid amount of directions sent', 'error': 'VALIDATION_ERROR' }
    });
    expect(eventsList[3].event).toBe('PLAYER_MOVE_ATTEMPT');
    expect(eventsList[4].event).toBe('GAME_ENDED');
    expect(eventsList[4].data.result).toBe('WINNER_FOUND');
  });

  test('should make two bots collide, both should lose', async () => {
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
          },
          {
            'name': 'Paul',
            'x': 0,
            'y': 0,
            'z': 1
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return [{
              task: 'MOVE',
              direction: '+Z'
            }];
          }
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            return [{
              task: 'BOMB',
              x: 1,
              y: 2,
              z: 3
            }];
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList.length).toBe(7);
    expect(eventsList[0].event).toBe('GAME_STARTED');
    expect(eventsList[1].event).toBe('NEXT_TICK');
    expect(eventsList[2].event).toBe('PLAYER_MOVE_ATTEMPT');
    expect(eventsList[3].event).toBe('PLAYER_PLACED_BOMB');
    expect(eventsList[4].event).toBe('PLAYER_LOST');
    expect(eventsList[4].data).toMatchObject({
      name: 'John',
      cause: 'Player crashed to other player'
    });
    expect(eventsList[5].event).toBe('PLAYER_LOST');
    expect(eventsList[5].data).toMatchObject({
      name: 'Paul',
      cause: 'Player crashed to other player'
    });
    expect(eventsList[6].event).toBe('GAME_ENDED');
    expect(eventsList[6].data.result).toBe('TIE');
  });

  test('should make bot named Paul win', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };
    const game = new Game({
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 1,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          },
          {
            'name': 'Paul',
            'x': 0,
            'y': 0,
            'z': 1
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return [{
              task: 'MOVE',
              direction: '+Y'
            }];
          }
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            return [{
              task: 'BOMB',
              x: 0,
              y: 1,
              z: 0
            }];
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList.length).toBe(6);
    expect(eventsList[0].event).toBe('GAME_STARTED');
    expect(eventsList[1].event).toBe('NEXT_TICK');
    expect(eventsList[2].event).toBe('PLAYER_MOVE_ATTEMPT');
    expect(eventsList[3].event).toBe('PLAYER_PLACED_BOMB');
    expect(eventsList[4].event).toBe('PLAYER_LOST');
    expect(eventsList[4].data).toMatchObject({
      name: 'John',
      cause: 'Player stepped on a BOMB'
    });
    expect(eventsList[5].event).toBe('GAME_ENDED');
    expect(eventsList[5].data.result).toBe('WINNER_FOUND');
    expect(eventsList[5].data.winner).toMatchObject({
      name: 'Paul',
      highScore: 1
    });
  });

  test('should make bot named Paul win after three ticks', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    let johnTickCount = 0;
    let paulTickCount = 0;

    const johnDirections = [[{
      task: 'MOVE',
      direction: '+Y'
    }], [{
      task: 'MOVE',
      direction: '+X'
    }], [{
      task: 'NOOP'
    }]];
    const paulDirections = [[{
      task: 'BOMB',
      x: 0,
      y: 0,
      z: 0
    }], [{
      task: 'MOVE',
      direction: '+Y'
    }], [{
      task: 'BOMB',
      x: 1,
      y: 1,
      z: 0
    }]];

    const game = new Game({
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 1,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          },
          {
            'name': 'Paul',
            'x': 0,
            'y': 0,
            'z': 1
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            const directions = johnDirections[johnTickCount];
            johnTickCount++;
            return directions;
          }
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            const directions = paulDirections[paulTickCount];
            paulTickCount++;
            return directions;
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList.length).toBe(12);
    expect(eventsList[0].event).toBe('GAME_STARTED');
    expect(eventsList[1].event).toBe('NEXT_TICK');
    expect(eventsList[2].event).toBe('PLAYER_MOVE_ATTEMPT');
    expect(eventsList[3].event).toBe('PLAYER_PLACED_BOMB');
    expect(eventsList[4].event).toBe('NEXT_TICK');
    expect(eventsList[4].data.items).toMatchObject([{ x: 0, y: 0, z: 0, type: 'BOMB' }]);
    expect(eventsList[4].data.players[0]).toMatchObject({
      name: 'John',
      x: 0,
      y: 1,
      z: 0
    });
    expect(eventsList[4].data.players[1]).toMatchObject({
      name: 'Paul',
      x: 0,
      y: 0,
      z: 1
    });
    expect(eventsList[5].event).toBe('PLAYER_MOVE_ATTEMPT');
    expect(eventsList[6].event).toBe('PLAYER_MOVE_ATTEMPT');
    expect(eventsList[7].event).toBe('NEXT_TICK');
    expect(eventsList[7].data.items).toMatchObject([{ x: 0, y: 0, z: 0, type: 'BOMB' }]);
    expect(eventsList[7].data.players[0]).toMatchObject({
      name: 'John',
      x: 1,
      y: 1,
      z: 0
    });
    expect(eventsList[7].data.players[1]).toMatchObject({
      name: 'Paul',
      x: 0,
      y: 1,
      z: 1
    });

    expect(eventsList[8].event).toBe('PLAYER_DID_NOTHING');
    expect(eventsList[9].event).toBe('PLAYER_PLACED_BOMB');

    expect(eventsList[10].event).toBe('PLAYER_LOST');
    expect(eventsList[10].data).toMatchObject({
      name: 'John',
      cause: 'Player stepped on a BOMB'
    });
    expect(eventsList[11].event).toBe('GAME_ENDED');

    expect(eventsList[11].data.result).toBe('WINNER_FOUND');
    expect(eventsList[11].data.winner).toMatchObject({
      name: 'Paul',
      highScore: 3
    });
  });

  test('should play two ticks on single bot directions response', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };
    const game = new Game({
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 2,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 6,
            'y': 6,
            'z': 0
          },
          {
            'name': 'Paul',
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
              task: 'MOVE',
              direction: '+Y'
            }];
          }
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            return [{
              task: 'NOOP'
            }, {
              task: 'NOOP'
            }];
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList.length).toBe(12);
    expect(eventsList).toMatchSnapshot();
  });

  test('Game should end when it has run long enough', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    const johnDirections = [{
      task: 'MOVE',
      direction: '+Y'
    }, {
      task: 'MOVE',
      direction: '-Y'
    }];

    const paulDirections = [{
      task: 'NOOP'
    }, {
      task: 'NOOP'
    }];

    const gameConfig = {
      'setup': {
        'maxNumOfTicks': 200,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 2,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          },
          {
            'name': 'Paul',
            'x': 0,
            'y': 0,
            'z': 1
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return johnDirections;
          }
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            return paulDirections;
          }
        }
      ]
    };
    const mockSocket = createMockSocket(socket);
    const game = new Game(gameConfig, mockSocket);

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList[eventsList.length - 1]).toMatchSnapshot();
  });

  test('should not have duplicate items in items array', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    let johnTickCount = 0;
    let paulTickCount = 0;

    const johnDirections = [{
      task: 'BOMB',
      x: 2,
      y: 2,
      z: 2
    }, {
      task: 'BOMB',
      x: 2,
      y: 2,
      z: 2
    }];
    const paulDirections = [{
      task: 'BOMB',
      x: 2,
      y: 2,
      z: 2
    }, {
      task: 'BOMB',
      x: 2,
      y: 2,
      z: 2
    }];

    const game = new Game({
      'setup': {
        'maxNumOfTicks': 4,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 2,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          },
          {
            'name': 'Paul',
            'x': 0,
            'y': 0,
            'z': 1
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return johnDirections;
          }
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            return paulDirections;
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    expect(eventsList).toMatchSnapshot();
  });

  test('should not have bombs in items array after bomb has exploded', async () => {
    const eventsList = [];
    const socket = (eventInfo) => {
      eventsList.push(eventInfo);
    };

    let johnTickCount = 0;
    let paulTickCount = 0;

    const johnDirections = [{
      task: 'BOMB',
      x: 2,
      y: 2,
      z: 2
    }, {
      task: 'BOMB',
      x: 0,
      y: 4,
      z: 5
    }];
    const paulDirections = [{
      task: 'BOMB',
      x: 2,
      y: 2,
      z: 2
    }, {
      task: 'BOMB',
      x: 2,
      y: 1,
      z: 3
    }];

    const ringoDirections = [{
      task: 'MOVE',
      direction: '-X'
    }, {
      task: 'NOOP'
    }];

    const game = new Game({
      'setup': {
        'maxNumOfTicks': 12,
        'edgeLength': 8,
        'speed': 0,
        'numOfTasksPerTick': 2,
        'playerStartPositions': [
          {
            'name': 'John',
            'x': 0,
            'y': 0,
            'z': 0
          },
          {
            'name': 'Ringo',
            'x': 7,
            'y': 2,
            'z': 2
          },
          {
            'name': 'Paul',
            'x': 0,
            'y': 0,
            'z': 1
          }
        ]
      },
      'players': [
        {
          'name': 'John',
          'url': (nextTickInfo) => {
            return johnDirections;
          }
        },
        {
          'name': 'Paul',
          'url': (nextTickInfo) => {
            return paulDirections;
          }
        },
        {
          'name': 'Ringo',
          'url': (nextTickInfo) => {
            return ringoDirections;
          }
        }
      ]
    }, createMockSocket(socket));

    game.start();

    // Wait game to finish
    await wait(1000);
    // 33 next tick before ringo stepping to bomb
    expect(eventsList[33]).toMatchSnapshot();
    // 37 ringo lost
    expect(eventsList[37]).toMatchSnapshot();
    // 38 next tick after bomb exploding and killing ringo
    expect(eventsList[38]).toMatchSnapshot();
  });

});


