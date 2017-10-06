import {
  BotDirection, Coordinate, Direction, MoveOrder, NextTickInfo, NextTickInfoForBot, PlayerPosition,
  PlayerSetup
} from './models';
import fetch from 'node-fetch';
import ErrorCode from './error-code';

export const getRandomInt = (max: number, min = 0) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandom3DCoordinate = (edgeLength: number): Coordinate => {
  return {
    x: getRandomInt(edgeLength),
    y: getRandomInt(edgeLength),
    z: getRandomInt(edgeLength)
  };
};

export const isSameCoordinate = (a: Coordinate, b: Coordinate) => {
  return a.x === b.x && a.y === b.y && a.z === b.z;
};

export const coordinateIsInUse = (a: Coordinate, arr: Coordinate[]) => {
  return arr.reduce((acc, b) => acc || isSameCoordinate(a, b), false);
};

export const getDirectionsFromBot = async (nextTickInfoForBot: NextTickInfoForBot): Promise<any> => {
  if (typeof nextTickInfoForBot.currentPlayer.url === 'function') {
    // Tests can emulate bot behaviour by having a function as url. Normally this is not possible
    return nextTickInfoForBot.currentPlayer.url(nextTickInfoForBot);
  }
  try {
    return await (await fetch(nextTickInfoForBot.currentPlayer.url, {
      method: 'POST',
      timeout: 5000,
      body: JSON.stringify(nextTickInfoForBot)
    })).json();
  } catch (err) {
    throw new Error(ErrorCode[ErrorCode.CONNECTION_ERROR]);
  }
};

export const isOutOfBounds = ({ x, y, z }: Coordinate, edgeLength: number) => {
  const indexLength = edgeLength - 1;
  return (x < 0 || y < 0 || z < 0 || x > indexLength || y > indexLength || z > indexLength);
};

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
