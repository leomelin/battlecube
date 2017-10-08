import * as Joi from 'joi';
import Error from './error-code';
import { BotDirection, GameConfig } from './models';

const gameConfigSchema = Joi.object().keys({
  setup: {
    edgeLength: Joi.number().positive().integer().required(),
    speed: Joi.number().positive().integer().allow(0).default(0).optional(),
    numOfTasksPerTick: Joi.number().positive().integer().required(),
    playerStartPositions: Joi.array().items(Joi.object().keys({
      name: Joi.string().required(),
      x: Joi.number().positive().integer().required(),
      y: Joi.number().positive().integer().required(),
      z: Joi.number().positive().integer().required()
    })).optional()
  },
  players: Joi.array().items(Joi.object().keys({
    name: Joi.string().required(),
    url: Joi.string().uri().required()
  }))
});

const bombOrderSchema = Joi.object().keys({
  task: Joi.string().allow('BOMB').required(),
  x: Joi.number().min(0).integer().required(),
  y: Joi.number().min(0).integer().required(),
  z: Joi.number().min(0).integer().required()
});

const noopSchema = Joi.object().keys({
  task: Joi.string().allow('NOOP').required()
});

const moveSchema = Joi.object().keys({
  task: Joi.string().allow('MOVE').required(),
  direction: Joi.string().allow('+X', '-X', '+Y', '-Y', '+Z', '-Z').required()
});

const botDirectionsSchema = Joi.array().items(bombOrderSchema, noopSchema, moveSchema);

export const getValidatedBotDirections = (payoad: any, gameConfig: GameConfig) => {
  const directionsValidationObj = Joi.validate(payoad, botDirectionsSchema);

  if (directionsValidationObj.error) {
    throw {
      error: Error[Error.VALIDATION_ERROR],
      details: directionsValidationObj.error.details
    };
  }

  const validBotDirections = <BotDirection[]>directionsValidationObj.value;
  if (validBotDirections.length > gameConfig.setup.numOfTasksPerTick ||
    validBotDirections.length < gameConfig.setup.numOfTasksPerTick) {
    throw {
      error: Error[Error.VALIDATION_ERROR],
      details: 'Invalid amount of directions sent'
    };
  }

  return directionsValidationObj.value;
};

export const getValidatedGameConfig = (payload: any, socket: any): GameConfig | null => {
  const gameConfigValidationObj = Joi.validate(payload, gameConfigSchema);

  if (gameConfigValidationObj.error) {
    socket.emit('ERROR', {
      error: Error[Error.INVALID_GAME_CONFIGURATION],
      details: gameConfigValidationObj.error.details
    });
    return null;
  }
  const gameConfig: GameConfig = gameConfigValidationObj.value;
  const playerNames = gameConfig.players.map(p => p.name);
  const uniquePlayerNames = [...new Set(playerNames)];
  if (playerNames.length !== uniquePlayerNames.length) {
    socket.emit('ERROR', {
      error: Error[Error.INVALID_GAME_CONFIGURATION],
      details: 'All player names must be unique'
    });
    return null;
  }
  if (gameConfig.setup.playerStartPositions) {
    if (gameConfig.setup.playerStartPositions.length !== gameConfig.players.length) {
      socket.emit('ERROR', {
        error: Error[Error.INVALID_GAME_CONFIGURATION],
        details: 'There are no player start positions for all players in the game'
      });
      return null;
    }

    const playerStartPositionNames = gameConfig.setup.playerStartPositions.map(p => p.name);

    // Make sure player names are the same in both arrays
    if (playerNames.every(p => playerStartPositionNames.indexOf(p) > -1)) {
      socket.emit('ERROR', {
        error: Error[Error.INVALID_GAME_CONFIGURATION],
        details: 'There are no player start positions for all players in the game'
      });
      return null;
    }
  }

  if (playerNames.length > Math.pow(gameConfig.setup.edgeLength, 3)) {
    socket.emit('ERROR', {
      error: Error[Error.INVALID_GAME_CONFIGURATION],
      details: 'Too many players for the selected game area size'
    });
    return null;
  }
  return gameConfig;
};
