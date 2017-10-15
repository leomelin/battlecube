import { h } from 'hyperapp';
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
  Matrix4
} from 'three';
import { IAppState, PlayerStatus } from './initialState';

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
  let children: any;
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
    ambientLight = new AmbientLight(0x898989);
    light = new DirectionalLight(0xffffff, 0.5);
    light.position.set(-50, 250, 300);
    // light.castShadow = true;
    // light.mapSize = 512;
    // light.mapSize = 512;
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
    cube = new Mesh(geometry, material);
    cube.name = 'cube';
    // cube.matrixAutoUpdate  = false;
    scene.add(cube);
  }

  function render() {
    renderer.render(scene, camera);
  }

  const getPosition = (x: number, y: number, z: number) => {
    const plusOrMinus = Math.random() < 0.5 ? -1 : 1;
    const getNum = (): number => Math.random() * 50 * plusOrMinus;
    // Possible solution?
    // const a = new Matrix4().set(/*..*/).makeTranslation(/*..*/);
    // const b = new Matrix4().set(/*..*/).makeTranslation(*..*/);
    // const matrix = new Matrix4().multiplyMatrices(a, b);
    return new Vector3(getNum(), getNum(), getNum());
  };

  const update = ({ players }: IAppState) => {
    cube.children = [];
    children = players
      .filter((p: any) => p.status !== PlayerStatus.inactive && p.name)
      .map((p: any) => ({ ...p.position, color: p.color, name: p.name }));

    children.forEach((p: any) => {
      const width = config.CUBE_WIDTH / segments;
      const geo = new SphereGeometry(width / 2);
      const material = new MeshPhongMaterial({
        shininess: 100,
        color: p.color,
        opacity: 0.8
      });
      material.transparent = true;
      const bot = new Mesh(geo, material);
      bot.name = p.name;
      // bot.castShadow = true;
      // bot.receiveShadow = true;
      const pos = getPosition(p.x, p.y, p.z);
      bot.position.set(pos.x, pos.y, pos.z);
      cube.add(bot);
      render();
    });
  };

  return {
    init,
    update
  };
};

export default (state: any, actions: any) =>
  h('div', {
    id: 'cube-container',
    oncreate: () => {
      actions.initCube(state);
    }
  });
