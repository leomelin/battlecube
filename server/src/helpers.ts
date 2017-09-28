import { BotDirection, Coordinate, Direction, MoveOrder, PlayerPosition, PlayerSetup } from './models';

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
  // TODO validate
  // Simulate bot
  const possibleDirections: Direction[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
  const botDirections: BotDirection[] = [{
    task: 'MOVE',
    direction: possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
  }];
  return botDirections;

  // throw new Error('Connection error');
};

export const isOutOfBounds = ({ x, y, z }: Coordinate, edgeLength: number) => {
  const indexLength = edgeLength - 1;
  return (x < 0 || y < 0 || z < 0 || x > indexLength || y > indexLength || z > indexLength);
};
