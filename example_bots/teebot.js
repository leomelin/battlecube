const http = require('http');
const [port] = process.argv.slice(2);

const arg = (n, defaultValue) => n >= process.argv.length ? defaultValue : process.argv[n];
const parseBool = (x) => parseInt(x) ? true : false;

const minMoves = parseInt(arg(3, 1));
const moveFraction = parseInt(arg(4, 2));
const implodeRadiusFraction = parseInt(arg(5, 2));
const explodeImplodeRatio = parseFloat(arg(6, 0.8));
const randomMovement = parseBool(arg(7, 0));
const randomTargeting = parseBool(arg(8, 0));
const randomSpread = parseBool(arg(9, 0));
const deterministic = parseBool(arg(10, 0));
const verbose = parseBool(arg(11, 0));

if (!port) {
  console.log('Pass port as command line argument...');
  process.exit(1);
}

const shuffle = (array) => {
  let arr = array.concat([]);
  if (deterministic) return arr;
  for (let i = arr.length - 1; i >= 0; i--) {
    var index = Math.floor(Math.random() * (i + 1)); 
    var item = arr[index]; 
    arr[index] = arr[i]; 
    arr[i] = item;
  }
  return arr;
}

const coordEq = (p, q) => p.x == q.x && p.y == q.y && p.z == q.z;

const helpers = (data) => {
  return {
    hasBomb: (p) => data.items.some(it => it.type === "BOMB" && coordEq(it, p)),
    hasPlayer: (p) => data.players.some(it => coordEq(it, p)),
    inBounds: (p) => [p.x, p.y, p.z].every(c => c >= 0 && c < data.gameInfo.edgeLength),
    me: data.players.find(p => p.name === data.currentPlayer.name)
  }
};

const explode = (tx, ty, tz, n, data) => {
  let queue = [{x: tx, y: ty, z: tz}]
  let done = [];
  let tasks = [];

  const {hasBomb, inBounds, me} = helpers(data);
  const isDone = (p) => done.some(it => coordEq(it, p));
  
  const prioritize = (xs) => {
    if(randomSpread) {
      return shuffle(xs);
    } else {
      return xs
        .map(x => Object.assign({ score: positionDesirability(x, data.currentPlayer.name, data) }, x))
        .sort((a, b) => a.score - b.score);
    }
  };

  while(queue.length && tasks.length < n) {
    const pos = queue.shift();

    if (!hasBomb(pos)) {
      tasks.push({ task: 'BOMB', x: pos.x, y: pos.y, z: pos.z });
    }

    if (tasks.length < n) {
      const neighbors = [
        {x: pos.x + 1, y: pos.y + 0, z: pos.z + 0},
        {x: pos.x - 1, y: pos.y + 0, z: pos.z + 0},
        {x: pos.x + 0, y: pos.y + 1, z: pos.z + 0},
        {x: pos.x + 0, y: pos.y - 1, z: pos.z + 0},
        {x: pos.x + 0, y: pos.y + 0, z: pos.z + 1},
        {x: pos.x + 0, y: pos.y + 0, z: pos.z - 1}
      ].filter(p => inBounds(p) && !isDone(p) && !coordEq(p, me));
      queue = queue.concat(prioritize(neighbors));
    }

    done.push(pos);
  }

  return tasks;
};

const implode = (tx, ty, tz, n, data) => {
  let queue = [{x: tx, y: ty, z: tz, d: 0}]
  let done = [];

  const {hasBomb, inBounds, me} = helpers(data);
  const isDone = (p) => done.some(it => coordEq(it, p));
  const implodeRadius = Math.ceil(data.gameInfo.numOfTasksPerTick / implodeRadiusFraction)
  const prioritize = (xs) => {
    if(randomSpread) {
      return shuffle(xs);
    } else {
      return xs
        .map(x => Object.assign({ score: positionDesirability(x, data.currentPlayer.name, data) }, x))
        .sort((a, b) => a.score - b.score);
    }
  };


  while(queue.length) {
    const pos = queue.shift();

    if (pos.d < implodeRadius) {
      const neighbors = [
        {x: pos.x + 1, y: pos.y + 0, z: pos.z + 0, d: pos.d + 1},
        {x: pos.x - 1, y: pos.y + 0, z: pos.z + 0, d: pos.d + 1},
        {x: pos.x + 0, y: pos.y + 1, z: pos.z + 0, d: pos.d + 1},
        {x: pos.x + 0, y: pos.y - 1, z: pos.z + 0, d: pos.d + 1},
        {x: pos.x + 0, y: pos.y + 0, z: pos.z + 1, d: pos.d + 1},
        {x: pos.x + 0, y: pos.y + 0, z: pos.z - 1, d: pos.d + 1}
      ].filter(p => inBounds(p) && !isDone(p) && !coordEq(p, me) && !hasBomb(p));
      queue = queue.concat(prioritize(neighbors));
    }

    done.push(pos);
  }

  const tasks = done.sort((a, b) => b.d - a.d).splice(0, n).map(pos => {
    return { task: 'BOMB', x: pos.x, y: pos.y, z: pos.z };
  });

  return tasks;
}

const pickTargets = (n, data) => {
  const others = data.players.filter(p => p.name != data.currentPlayer.name);
  const prioritize = (xs) => {
    if(randomTargeting) {
      return shuffle(xs);
    } else {
      return xs
        .map(x => Object.assign({ score: positionDesirability(x, x.name, data) }, x))
        .sort((a, b) => a.score - b.score);
    }
  };
  const targets = prioritize(others)
    .splice(0, n)
    .map(t => Object.assign(t, {n: 1}));

  if (targets.length < n) {
    const left = n - targets.length;
    for (let i = 0; i < left; ++i) {
      targets[i % targets.length].n += 1;
    }
  }

  return targets;
}

const positionDesirability = (pos, player, data) => {
  const distSq = (a, b) => (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y) + (b.z - a.z) * (b.z - a.z) 
  const bombProximityScore = data.items
    .filter(i => i.type === 'BOMB')
    .map(i => distSq(i, pos))
    .reduce((sum, x) => sum + x, 0)

  const playerProximityScore = data.players
    .filter(p => p.name != player)
    .map(p => distSq(p, pos))
    .reduce((sum, x) => sum + x, 0)

  return bombProximityScore + playerProximityScore;
}

const moveDistance = (n, data) => {
  const {hasBomb, hasPlayer, inBounds, me} = helpers(data);

  let queue = [{x: me.x, y: me.y, z: me.z, moves: []}]
  let tasks = [];
  let done = [];
  const isDone = (p) => done.some(it => coordEq(it, p));
  
  while(queue.length) {
    const pos = queue.shift();

    if (pos.moves.length >= n) {
      // Desired distance reached
      return pos.moves.map(m => { return {task: 'MOVE', direction: m} }).splice(0, n);
    } else {
      const neighbors = [
        {x: pos.x + 1, y: pos.y + 0, z: pos.z + 0, moves: pos.moves.concat(['+X'])},
        {x: pos.x - 1, y: pos.y + 0, z: pos.z + 0, moves: pos.moves.concat(['-X'])},
        {x: pos.x + 0, y: pos.y + 1, z: pos.z + 0, moves: pos.moves.concat(['+Y'])},
        {x: pos.x + 0, y: pos.y - 1, z: pos.z + 0, moves: pos.moves.concat(['-Y'])},
        {x: pos.x + 0, y: pos.y + 0, z: pos.z + 1, moves: pos.moves.concat(['+Z'])},
        {x: pos.x + 0, y: pos.y + 0, z: pos.z - 1, moves: pos.moves.concat(['-Z'])}
      ].filter(p => inBounds(p) && !isDone(p) && !hasBomb(p) && !hasPlayer(p));
      if (randomMovement) {
        queue = queue.concat(shuffle(neighbors));
      } else {
        const rankedNeighbors = neighbors
          .map(n => Object.assign({score: positionDesirability(n, data.currentPlayer.name, data)}, n))
          .sort((a, b) => b.score - a.score);
        queue = queue.concat(rankedNeighbors);
      }
    }
    done.push(pos);
  }

  // Find the longest path as fallback
  const best = done.reduce(
    (best, x) => best.moves.length < x.moves.length ? x : best, 
    {moves: []})
  return best.moves.map(m => { return {task: 'MOVE', direction: m} })
}

const getDirections = (data) => {
  const numTasks = data.gameInfo.numOfTasksPerTick;
  const moves = moveDistance(Math.max(minMoves, numTasks / moveFraction), data);
  if(verbose) console.log("Moves:", JSON.stringify(moves))
  const targets = pickTargets(numTasks - moves.length, data);
  if(verbose) console.log("Targets:", JSON.stringify(targets))
  const flatMap = (xs, f) => xs.reduce((ts, x) => ts.concat(f(x)), [])
  const strategy = () => Math.random() < explodeImplodeRatio ? explode : implode;
  const tasks = moves.concat(flatMap(targets, t => strategy()(t.x, t.y, t.z, t.n, data)))
  if(verbose) console.log("Tasks:", JSON.stringify(tasks))
  return tasks;
};

http.createServer((req, res) => {
  if (req.method === 'POST') {
    let jsonString = '';

    req.on('data', (data) => {
      jsonString += data;
    });

    req.on('end', () => {
      const nextTickInfo = JSON.parse(jsonString);
      if(verbose) console.log('we got next tick info', nextTickInfo);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getDirections(nextTickInfo)));
    });

  }
}).listen(port);

// Console will print the message
console.log(`TeeBot running at http://127.0.0.1:${port}/`);
console.log(`
  minMoves: ${minMoves}
  moveFraction: ${moveFraction}
  implodeRadiusFraction: ${implodeRadiusFraction}
  explodeImplodeRatio: ${explodeImplodeRatio}
  randomMovement: ${randomMovement}
  randomTargeting: ${randomTargeting}
  randomSpread: ${randomSpread}
  deterministic: ${deterministic}
`)
