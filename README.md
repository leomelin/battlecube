# Battlecube

Battlecube is a game where small cubes (bots) fight each other with bombs inside a cube shaped 3d grid.

## Rules

Basically all you have to do is create a bot that stays on the game area, doesn't collide with others and don't stand on a bomb. It's as easy as that ... ;)

- All bots in the game must implement correct API -endpoints, otherwise bot automatically loses
- Amount of bots in the game cannot be larger than there is space in the game area
- If bot moves out of the game area, it loses
- If bot moves to the same coordinate as other bot, both bots lose
- If bot is placed in the same coordinate as a bomb, bomb explodes and bot loses
- If bot doesn't respond request in 5000ms it will automatically lose
- Game area coordinates start from index 0 and ends with edge length - 1
- Game area coordinates are counted as X: left to right, Y: top to bottom, Z: front to back. So that `{ x: 0, y: 0, z: 0 }` would be the top left corner on front.
- All the bots in the game must have an unique name
- The time is measured in *ticks* in other words play turns. Ticks start from 0.
- Game area size might change during the game. If so, players are randomly positioned after that and all the bombs currently placed are removed.
- The bot that survives the longest amount of *ticks* without losing, *WINS*

## Starting a new game

1. Connect to server API address via socket.io (websocket) using `npm run start:client` or by implementing your own client.
2. Emit "NEW_GAME" event with proper configuration to start a new game: (Remember to start the bot services first!)
```js
{
  "setup": {
    "edgeLength": <number>,
    "speed": <number>, /* milliseconds to delay between ticks, zero being the fastest setting. */
    "numOfTasksPerTick": <number>, /* how many tasks bots can do per tick */
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
No json, just a confirmation that a new game was successfully initialized.

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

#### POST /play

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
After receiving this data, your bot should respond with *Content-Type: application/json* one of following json structures and HTTP status 200 OK in under 5000ms:

###### Move
Moves the player one unit in any direction
```js
[{
  "task": "MOVE",
  "direction": "+X"|"-X"|"+Y"|"-Y"|"+Z"|"-Z"
}, ... ]
```

###### Place a bomb
Places a bomb to selected coordinates
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

Note that the bot needs to respond an array of tasks. Maximum number of tasks per tick is defined in game configuration.
