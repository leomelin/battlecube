import { Coordinate, PlayerSetup } from './models';

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
  return `${a.x}-${a.y}-${a.z}` === `${b.x}-${b.y}-${b.z}`;
};

export const coordinateIsInUse = (a: Coordinate, arr: Coordinate[]) => {
  return arr.reduce((acc, b) => acc || isSameCoordinate(a, b), false);
};

export const getDirectionsFromBot = async (player: PlayerSetup) => {
  // TODO use fetch to get directions and throw error on timeout etc
  throw new Error('Connection error');
};
