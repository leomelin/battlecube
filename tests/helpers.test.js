const helpers = require('../build/helpers');
describe('Coordinate is in use helper method', () => {
  const arr = [
    {
      x: 3,
      y: 4,
      z: 14
    },
    {
      x: 12,
      y: 13,
      z: 14
    },
    {
      x: 12,
      y: 12,
      z: 14
    }
  ];

  test('coordinate should be in use', () => {
    expect(helpers.coordinateIsInUse({
      x: 12,
      y: 13,
      z: 14
    }, arr)).toBe(true);
  });

  test('coordinate should not be in use', () => {
    expect(helpers.coordinateIsInUse({
      x: 11,
      y: 13,
      z: 14
    }, arr)).toBe(false);
  });
});

