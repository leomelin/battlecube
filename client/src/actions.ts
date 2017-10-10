import { GameStatus, IAppState, ILogItem, MessageType } from './initialState';

import THREE from 'three';

import socket, { ITickInfo } from './socket';

export const io = socket('http://localhost:9999');

interface IStart {
  (state?: IAppState, actions?: IActions): void;
  [key: string]: any;
}

interface IUpdateSpeed {
  (state: IAppState, actions: IActions, speed: number): Object;
  [key: string]: any;
}

export interface IActions {
  start: IStart;
  setup: {
    updateSpeed: IUpdateSpeed;
  };

  log(): any;
  clearLog(): any;
  [key: string]: any;
}

// see https://github.com/hyperapp/hyperapp/blob/master/docs/thunks.md for how hyperapp actions work

export default <IActions>{
  start: (state: IAppState, actions: IActions) => {
    actions.clearLog();
    io.startGame({ setup: state.setup, players: state.players });
  },

  // set the amount of milliseconds delay you want between ticks
  // could add further config here
  setup: {
    updateSpeed: (state: IAppState, actions: IActions, speed: number) => ({
      speed,
      ...state.setup
    })
  },

  drawCube: () => {
    const container = document.getElementsByClassName('canvas-3d')[0];

    let camera: any;
    let scene: any;
    let renderer: any;
    let cube: any;

    // create the camera
    camera = new THREE.PerspectiveCamera(70, 500 / 500, 1, 1000);
    camera.position.y = 150;
    camera.position.z = 350;
    // create the Scene
    scene = new THREE.Scene();
    // create the Cube
    const geometry = new THREE.BoxBufferGeometry(200, 200, 200);

    const material = new THREE.MeshNormalMaterial({
      wireframe: true
    });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.y = 150;
    // add the object to the scene
    // create the container element

    // init the WebGL renderer and append it to the Dom
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(500, 500);
    container.appendChild(renderer.domElement);

    // animate the cube
    setInterval(() => {
      cube.rotation.x += 0.02;
      cube.rotation.y += 0.0225;
      cube.rotation.z += 0.0175;
      // actually display the scene in the Dom element
      renderer.render(scene, camera);
    }, 20);
  },

  updateGameStatus: () => (update: Function) => {
    io.onStart(() => update({ gameStatus: GameStatus.started }));
    io.onStop((finalInfo: any) => {
      update((state: IAppState) => {
        const winner = `🏆 WINNER: ${finalInfo.winner.name}`;
        const results = finalInfo.scores
          .sort((a: any, b: any) => b.highScore - a.highScore)
          .map((s: any) => `${s.name}: ${s.highScore}`)
          .join(', ');
        const scores = `RESULTS: ${results}`;
        const log = [
          { name, message: { winner, scores }, type: MessageType.result },
          ...state.log
        ];
        return { ...state, log, gameStatus: GameStatus.stopped };
      });
    });
  },

  // every time a socket message is received the update function will add a message to the log
  log: () => (update: Function) => {
    io.onPlayerMove(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message }, ...state.log]
      }));
    });
    io.onPlantBomb(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message }, ...state.log]
      }));
    });
    io.onPlayerDoesNothing(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message }, ...state.log]
      }));
    });
    io.onPlayerLoses(({ name, message }: ILogItem) => {
      update((state: IAppState) => ({
        log: [{ name, message, type: MessageType.special }, ...state.log]
      }));
    });
    io.onTick(({ players = [], gameInfo }: ITickInfo) => {
      update((state: IAppState) => {
        const playerList = players.map(p => p.name).join(', ');
        const currentPlayers = `Active players: ${playerList}`;
        const currentTick = `📍 TICK #${gameInfo.currentTick}`;
        const log = [
          { message: { currentPlayers, currentTick }, type: MessageType.tick },
          ...state.log
        ];
        return { log };
      });
    });
  },

  clearLog: () => ({ log: [] })
};
