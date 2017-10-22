# Battlecube

Battlecube is a game in which bots fight to survive inside a three-dimensional grid--the cube--by moving and throwing bombs.

## Rules

Basically, all you have to do is create a bot that stays in the grid, avoids colliding with others and doesn't run into a bomb. It's as easy as that ... ;)

- A participating bots must implement a correct API -endpoint, otherwise the bot automatically loses
- The amount of bots in the game cannot be larger than there is space in the game area
- If a bot moves out of the game area, it loses
- If a bot moves to the same coordinate as another bot, both bots lose
- If a bot is placed in the same coordinate as a bomb, the bomb explodes and the bot loses
- If the bot doesn't respond to a request in 5000ms, it will automatically lose
- Game area coordinates start from index 0 and ends with edge length - 1
- Game area coordinates are counted as X: left to right, Y: top to bottom, Z: front to back. So that `{ x: 0, y: 0, z: 0 }` would be the top left corner on front.
- All the bots in the game must have an unique name
- The time is measured in *ticks* , in other words, play turns. Ticks start from 0.
- If a bot is allowed to give more directions at once (numOfTasksPerTick), directions will be asked again after all directions are evaluated. So with a value of numOfTaskPerTick 2, the server will play two ticks before asking for another 2 directions.
- The game/grid size might change during the game. If so, players are randomly positioned after that and all the bombs currently placed are removed.
- The bot that survives the longest amount of *ticks* without losing, *WINS*

## Starting a new game

1. Connect to server API address via socket.io (websocket) using `npm run start:client` or by implementing your own client.
2. Emit "NEW_GAME" event with proper configuration to start a new game: (Remember to start the bot services first!)
```js
{
  "setup": {
    "maxNumOfTicks": <number>, /* This must be set to force the game to stop at some point if bots won't die */
    "edgeLength": <number>,
    "speed": <number>, /* milliseconds to delay between ticks, zero being the fastest setting. */
    "numOfTasksPerTick": <number>, /* how many tasks bots can send at once (= how many ticks bots need to plan in advance) */
    "playerStartPositions": [ /* This is optional (for dev puropses). If not set, will be random. */
      {
        "name": <string>,
        "x": <number>,
        "y": <number>,
        "z": <number> 
      },
      ...
    ]
  },
  "players": [{
    "name": <string>,
    "url": <string> /* the http endpoint for your bot service. e.g. http://my-cool-bot.com */
  }, ...]
}
```
3. Listen to "GAME_STARTED", "PLAYER_LOST", "GAME_ENDED", "PLAYER_MOVE_ATTEMPT", "PLAYER_PLACED_BOMB", "PLAYER_DID_NOTHING" and "NEXT_TICK" events. These will keep you informed what has happened:

###### GAME_STARTED event
A confirmation that a new game was successfully initialized.
```js
{
  "id": <string> /* Game id */
}
``` 

###### PLAYER_LOST event
Get info when some player loses the game
```js
{
  "name": <string>, /* Player name */
  "cause": <string> /* Explanation why player lost the game */
}
``` 

###### GAME_ENDED event
Here we can get info about the winner
```js
{
  "id": <string>, // Game id
  "result": "TIE"|"WINNER_FOUND",
  "winner": { // Optionally here if not TIE
    "name": <string>,
    "url": <string>, /* the http endpoint for your bot service. e.g. http://my-cool-bot.com */
    "score": <number>
  },
  "scores": [
    "name": <string>, /* Player name */
    "url": <string>, /* the http endpoint for your bot service. e.g. http://my-cool-bot.com */
    "score": <number> /* Number of ticks player survived */ 
  ]

}
``` 

###### PLAYER_MOVE_ATTEMPT event
Just for logging purposes
```js
{
  "name": <string>, /* Player name */
  "direction": "+X"|"-X"|"+Y"|"-Y"|"+Z"|"-Z"
}
```

###### PLAYER_PLACED_BOMB event
Get info who placed a bomb and where
```js
{
  "name": <string>, /* Player name */
  "x": <number>, 
  "y": <number>,
  "z": <number> 
}
```

###### PLAYER_DID_NOTHING event
Get info when player NOOPed
```js
{
  "name": <string>, /* Player name */
  "x": <number>, 
  "y": <number>,
  "z": <number> 
}
```

###### NEXT_TICK event
A new tick happened, get current game info, bomb and player positions
```js
{
  "gameInfo": {
    "id": <string>,
    "edgeLength": <number>,
    "numOfTasksPerTick": <number>, /* how many tasks bots can do per tick */
    "numOfBotsInPlay": <number>,
    "currentTick": <number>
  },
  "players": [
    {
      "name": <string>,
      "x": <number>,
      "y": <number>,
      "z": <number> 
    },
    ...
  ],
  "items": [
    {
      "type": "BOMB",
      "x": <number>,
      "y": <number>,
      "z": <number> 
    },
    ...
  ]
}
```

## Bot API design

Your bot needs to implement this design to be able to play.

#### POST /

This is the endpoint that gets called by the Battlecube server.
Your bot implementation should have this endpoint implemented and it should accept the following json structure as HTTP request body with *Content-Type: application/json*.
```js
{
  "currentPlayer": {
    "name": <string>,
    "url": <string> /* the http endpoint for your bot service. e.g. http://my-cool-bot.com */
  },
  "gameInfo": {
    "edgeLength": <number>,
    "numOfBotsInPlay": <number>,
    "currentTick": <number>
  },
  "players": [
    {
      "name": <string>,
      "x": <number>,
      "y": <number>,
      "z": <number> 
    },
    ...
  ],
  "items": [
    {
      "type": "BOMB",
      "x": <number>,
      "y": <number>,
      "z": <number> 
    },
    ...
  ]
}
```
After receiving this data, your bot should respond with *Content-Type: application/json*, one of following json structures, and HTTP status 200 OK in under 5000ms:

###### Move
Moves the player one unit in any direction
```js
[{
  "task": "MOVE",
  "direction": "+X"|"-X"|"+Y"|"-Y"|"+Z"|"-Z"
}, ... ]
```

###### Place a bomb
Place a bomb to particular coordinates
```js
[{
  "task": "PLACE_BOMB",
  "x": <number>, 
  "y": <number>,
  "z": <number> 
}, ...]
```

###### ...Or do nothing
```js
[{
  "task": "NOOP"
}, ...]
```

Note that the bot needs to respond with an array of tasks. The maximum number of tasks per tick is defined in the game configuration.
