# [Battle³](https://battle3.site/)

A game in which bots fight to survive inside a three-dimensional grid--the cube--by moving and throwing bombs.

## Part of [Web Dev and Sausage's](https://www.webdevandsausages.org/) Micro Christmas Hackathon (24.11.2017)

The idea is that you/your team creates its own bot(s) to fight other bots in Battle³. In addition, or alternatively, we welcome you to invent new clients to visualize the game. At the end of the hackathon, prizes will be given for bots as well as new clients. For your bot to engage other bots in battle, it will need to have a public url. Where your bot lives is up to you, but we will provide expert help during the hackathon to use a [AWS Lamba](https://aws.amazon.com/lambda/?sc_channel=PS&sc_campaign=acquisition_ND&sc_publisher=google&sc_medium=lambda_b&sc_content=lambda_e&sc_detail=aws%20lambda&sc_category=lambda&sc_segment=161192959428&sc_matchtype=e&sc_country=ND&s_kwcid=AL!4422!3!161192959428!e!!g!!aws%20lambda&ef_id=WaJDZAAAAgRf99VN:20171031124232:s) or a [Firebase function](https://firebase.google.com/docs/functions/).
Here is an example of running a bot in a Firebase cloud function: [firebase-bot](https://github.com/RikuVan/firebase-teebot). Teebot's player url is https://us-central1-battlecube-teebot.cloudfunctions.net/teebot.

## Getting started

1. Make sure you have a recent version of node. We have only tested it with v7.10.0 and above.
2. Clone the repo, `npm install` and `npm run build`.
3. You will need to have some working bots to see battle. To start off with, use the dummy bots under `/example_bots`. Fire up a bot with `node dumb-bot.js 4001`. Do the same for the three others using ports 4002-4004. Later when you want tougher competition, you can battle with `teebot.js`, who should be a very tough competitor. Notice you will immediately get an error if you have a bot listed as a player which does not respond to requests.
4. Finally, start up the server and client: `npm run start:all` (If the default ports are already in use, 9999 for the server and 8080 for the client, start:all will probably just hang mysteriously. The ports can be changed in `server.js` and `rollup.config.js`).

- If you want to disable use localeStorage, which can be annoying when making client changes, change `disablePersistence` to `true` in `client.ts`

- If you have any issues getting the code running, or find a bug, before the Micro Christmas Hackathon, make an issue in the repo and we will fix it/ try to help you out.

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

## Champion bots

- To judge the strongest bot, we will run a batch of battles, e.g. 100. The winning bot is the bot with the most *wins* or, in the case of a tie, the bot who has has lived the most ticks.

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
  "winner": { /* Optionally here if not TIE */
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

This is the endpoint that gets called by the Battle³ server.
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
    "currentTick": <number>,
    "numOfTasksPerTick": <number>
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
After receiving this data, your bot should respond with `Content-Type: application/json`, one of following json structures, and HTTP status 200 OK in under 5000ms:

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

