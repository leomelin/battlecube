# Battlecube

Battlecube is a game where small cubes (bots) fight each other with bombs inside a cube shaped 3d grid.

## Rules

Basically all you have to do is create a bot that stays on the game area, doesn't collide with others and don't stand on a bomb. It's as easy as that ... ;)

- All bots in the game must implement correct API -endpoints, otherwise bot automatically loses
- Bots in the game cannot be larger than there is space in the game area
- If bot directions would move the bot out of the game area, it loses
- If bot is directions would move the bot on the same coordinate as other bot, both bots lose
- If bot is placed in the same coordinate as a bomb, bot loses and bomb disappears
- If bot doesn't respond request in 5000ms it will automatically lose
- Game area coordinates start from index 0 and ends with edge length - 1
- Game area coordinates are counted as X: left to right, Y: top to bottom, Z: front to back. So that `{ x: 0, y: 0, z: 0 }` would be the top left corner on front.
- All the bots in the game must have an unique name
- The time is measured in *ticks* in other words play turns. Ticks start from 0.
- Game area size might change during the game. If so, players are randomly positioned after that and all the bombs currently placed are removed.
- The bot that survives the longest amount of *ticks* without losing, *WINS*

## Starting a new game

1. Connect to server API address via websocket
2. Emit "NEW_GAME" event with proper configuration to start a new game:
```json
{
  "setup": [
    "edgeLength": <number>,
    "speed": <number>, /* milliseconds to delay between ticks, zero being the fastest setting. */
    "playerStartPositions": [ /* This is optional (for dev puropses). If not set, will be random. */
      {
        "name": <string>,
        "x": <number>,
        "y": <number>,
        "z": <number> 
      },
      ...
    ]
  ],
  "players": [
    "name": <string>,
    "url": <string> /* the http endpoint for your bot service. e.g. http://my-cool-bot.com */
  ]
}
```
3. Listen for "GAME_STARTED", "PLAYER_LOST", "GAME_ENDED", "PLAYER_MOVED", "PLAYER_PLACED_BOMB" and "NEXT_TICK" events. These will keep you informed what has happened:

###### GAME_STARTED event
No json, just a confirmation that a new game was successfully initialized.

###### PLAYER_LOST event
Get the info when some player loses the game
```json
{
  "name": <string>, /* Player name */
  "cause": <string> /* Explanation why player lost the game */
}
``` 

###### GAME_ENDED event
Here we can get the info about the winner
```json
{
  "result": "TIE"|"WINNER_FOUND"|"NO_WINNER",
  "scores": [
    "name": <string>, /* Player name */
    "score": <number> /* Number of ticks player survived */ 
  ]

}
``` 

###### PLAYER_MOVED event
Just for logging purposes
```json
{
  "name": <string>, /* Player name */
  "direction": "+X"|"-X"|"+Y"|"-Y"|"+Z"|"-Z"
}
```

###### PLAYER_PLACED_BOMB event
Get info who placed a bomb and where
```json
{
  "name": <string>, /* Player name */
  "x": <number>, 
  "y": <number>,
  "z": <number> 
}
```

###### NEXT_TICK event
A new tick happened, get current game info, bomb and player positions
```json
{
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

## Bot API design

Your bot needs to implement this design to be able to play.

#### POST /play

This is the endpoint that gets called by the Battlecube server.
Your bot implementation should have this endpoint implemented and it should accept the following json structure as HTTP request body with *Content-Type: application/json*.
```json
{
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
```json
{
  "task": "MOVE",
  "direction": "+X"|"-X"|"+Y"|"-Y"|"+Z"|"-Z"
}
```

###### Place a bomb
Places a bomb to selected coordinates
```json
{
  "task": "PLACE_BOMB",
  "x": <number>, 
  "y": <number>,
  "z": <number> 
}
```

###### ...Or do nothing
```json
{
  "task": "NOOP"
}
