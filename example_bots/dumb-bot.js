const http = require('http');
const [port] = process.argv.slice(2);
if (!port) {
  console.log('Pass port as command line argument...');
  process.exit(1);
}

const getRandomInt = (max, min = 0) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getPlaceBombDirection = (nextTickInfo) => {
  return {
    task: 'BOMB',
    x: getRandomInt(0, nextTickInfo.gameInfo.edgeLength),
    y: getRandomInt(0, nextTickInfo.gameInfo.edgeLength),
    z: getRandomInt(0, nextTickInfo.gameInfo.edgeLength)
  }
};

const getNoopDirection = () => {
  return {
    task: 'NOOP'
  }
};

const getMoveDirection = (nextTickInfo) => {
  const allDirections = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
  const currentCoordinates = nextTickInfo.players.find(p => p.name === nextTickInfo.currentPlayer.name);

  const badCoordinates = [];
  if (currentCoordinates.x === 0) {
    badCoordinates.push('-X');
  }
  if (currentCoordinates.x === nextTickInfo.gameInfo.edgeLength - 1) {
    badCoordinates.push(('+X'));
  }
  if (currentCoordinates.y === 0) {
    badCoordinates.push('-Y');
  }
  if (currentCoordinates.y === nextTickInfo.gameInfo.edgeLength - 1) {
    badCoordinates.push(('+Y'));
  }
  if (currentCoordinates.z === 0) {
    badCoordinates.push('-Z');
  }
  if (currentCoordinates.z === nextTickInfo.gameInfo.edgeLength - 1) {
    badCoordinates.push(('+Z'));
  }

  const possibleDirections = allDirections.filter(d => !badCoordinates.includes(d));
  return {
    task: 'MOVE',
    direction: possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
  };
};

const getDirections = (nextTickInfo) => {
  const numOfTasksToDo = nextTickInfo.gameInfo.numOfTasksPerTick;
  const botDirections = [];
  const possibleTasks = [getMoveDirection, getNoopDirection, getPlaceBombDirection];
  for (let i = 0; i < numOfTasksToDo; i++) {
    const task = possibleTasks[Math.floor(Math.random() * possibleTasks.length)];
    botDirections.push(task(nextTickInfo));
  }
  return botDirections;
};

http.createServer((req, res) => {
  if (req.method === 'POST') {
    let jsonString = '';

    req.on('data', (data) => {
      jsonString += data;
    });

    req.on('end', () => {
      const nextTickInfo = JSON.parse(jsonString);
      console.log('we got next tick info', nextTickInfo);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // Send the response body as "Hello World"
      res.end(JSON.stringify(getDirections(nextTickInfo)));
    });

  }
}).listen(port);

// Console will print the message
console.log(`Dumb-bot running at http://127.0.0.1:${port}/`);