import { h } from 'hyperapp';
import { Easing, Tween, autoPlay } from 'es6-tween/src/index.lite';
autoPlay(true);
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  SphereGeometry,
  MeshPhongMaterial,
  Mesh,
  DirectionalLight,
  Vector3,
  PCFSoftShadowMap,
  AmbientLight,
  Matrix4,
  IcosahedronGeometry
} from 'three';
import { IAppState, PlayerStatus, IPosition } from './initialState';

const config = {
  WIDTH: 400,
  HEIGHT: 400,
  NEAR: 1,
  FAR: 1000,
  MATERIAL: {
    wireframe: true,
    wireframeLinewidth: 2
  },
  HUE: 1,
  CUBE_WIDTH: 112
};

export const createCube = () => {
  let camera: any;
  let scene: any;
  let geometry: any;
  let ambientLight: any;
  let light: any;
  let renderer: any;
  let cube: any;
  let segments: number;
  let container: any;
  let material: any;

  const init = ({ setup }: IAppState) => {
    segments = setup.edgeLength - 1;
    scene = new Scene();
    camera = new PerspectiveCamera(
      45,
      config.WIDTH / config.HEIGHT,
      config.NEAR,
      config.FAR
    );
    camera.position.z = 200;
    camera.lookAt(new Vector3(0, 0, 0));
    ambientLight = new AmbientLight(0x898989);
    light = new DirectionalLight(0xffffff, 0.5);
    light.position.set(-50, 250, 300);

    scene.add(ambientLight);
    scene.add(light);

    addCube();

    renderer = new WebGLRenderer();
    renderer.setClearColor(0x131313);
    renderer.setSize(config.WIDTH, config.HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    container = document.getElementById('cube-container');
    container.appendChild(renderer.domElement);

    render();
  };

  function addCube() {
    geometry = new BoxGeometry(
      config.CUBE_WIDTH,
      config.CUBE_WIDTH,
      config.CUBE_WIDTH,
      segments,
      segments,
      segments
    );
    material = new MeshPhongMaterial({
      wireframe: true,
      color: '#55ff55'
    });
    cube = new Mesh(geometry, material);
    cube.name = 'cube';

    scene.add(cube);
  }

  function render() {
    renderer.render(scene, camera);
  }

  const getPosition = (x: number, y: number, z: number) => {
    // Scale grid entity coordinates to grid space
    const scale = config.CUBE_WIDTH / segments;
    const s = new Matrix4().makeScale(scale, scale, scale);

    // Center grid
    const center = segments / 2.0;
    const t = new Matrix4().makeTranslation(-center, -center, -center);

    // Create transformation matrix
    const st = new Matrix4().multiplyMatrices(s, t);

    // Transform grid space vector to world space
    return new Vector3(x, y, z).applyMatrix4(st);
  };

  const makeBomb = ({ x, y, z }: IPosition, name: string) => {
    const width = config.CUBE_WIDTH / segments / 2.5;
    const geometry = new IcosahedronGeometry(width, 0);
    const material = new MeshPhongMaterial({
      name,
      color: 0x9b9b9b,
      flatShading: true
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  };

  const makeBot = ({ color, position: { x, y, z } }: any, name: string) => {
    const width = config.CUBE_WIDTH / segments;
    const geo = new SphereGeometry(width / 2);
    const material = new MeshPhongMaterial({
      color,
      shininess: 100,
      opacity: 0.8
    });
    material.transparent = true;
    const bot = new Mesh(geo, material);
    bot.name = name;
    bot.position.set(x, y, z);
    return bot;
  };

  const hasMoved = (pos1: any, pos2: any) => !pos1.equals(pos2);

  const tweenVector3 = (obj: any, { x, y, z }: any, duration = 100) => {
    const tweenVector3 = new Tween(obj.position)
      .to({ x, y, z }, duration)
      .easing(Easing.Sinusoidal.In)
      .onUpdate(render)
      .start();
    return tweenVector3;
  };

  const update = ({ players, bombs, setup }: IAppState) => {
    const bombMap = bombs.reduce((map: any, b) => {
      const { x, y, z } = getPosition(b.x, b.y, b.z);
      map.set(`${x}/${y}/${z}`, { x, y, z });
      return map;
    }, new Map());

    const playerMap = players.reduce((map: any, { position, name, color, status }: any) => {
      if (status === PlayerStatus.inactive || !name) {
        return map;
      }
      map.set(name, { name, color, position: getPosition(position.x, position.y, position.z) });
      return map;
    }, new Map());

    for (let i = cube.children.length - 1; i >= 0; i = i - 1) {
      const obj = cube.children[i];

      if (playerMap.has(obj.name)) {
        const newPos = playerMap.get(obj.name).position;

        if (hasMoved(newPos, obj.position)) {
          const newCoords = { x: newPos.x, y: newPos.y, z: newPos.z };
          tweenVector3(obj, newCoords, setup.speed);

          playerMap.delete(obj.name);
        } else {
          playerMap.delete(obj.name);
        }
      } else if (!bombMap.has(obj.name)) {
        cube.remove(obj);
      } else {
        bombMap.delete(obj.name);
      }
    }

    bombMap.forEach(({ x, y, z }: IPosition, name: string) => {
      const bomb = makeBomb({ x, y, z }, name);
      cube.add(bomb);
    });

    playerMap.forEach((player: any, name: string) => {
      const bot = makeBot(player, name);
      cube.add(bot);
    });

    render();
  };

  const resize = (length: number) => {
    scene.remove(cube);
    segments = length;
    addCube();
    render();
  };

  const reset = () => {
    camera = null;
    scene = null;
    ambientLight = null;
    light = null;
    renderer = null;
    cube = null;
    segments = 0;
    container = null;
    material = null;
  };

  return {
    init,
    update,
    resize,
    reset
  };
};

export default (state: any, actions: any) =>
  h('div', {
    id: 'cube-container',
    oncreate: () => {
      actions.initCube(state);
    },
    onremove: () => {
      state.cube.reset();
      actions.destroyCube();
    }
  });
