import { h } from 'hyperapp';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  DirectionalLight,
  Vector3,
  PCFSoftShadowMap,
  AmbientLight
} from 'three';
import { IAppState } from './initialState';

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
    segments = setup.edgeLength;
    scene = new Scene();
    camera = new PerspectiveCamera(
      45,
      config.WIDTH / config.HEIGHT,
      config.NEAR,
      config.FAR
    );
    camera.position.z = 200;
    camera.lookAt(new Vector3(0, 0, 0));
    geometry = new BoxGeometry(config.CUBE_WIDTH, config.CUBE_WIDTH, config.CUBE_WIDTH, segments, segments, segments);
    material = new MeshBasicMaterial({
      wireframe: true,
      color: '#55ff55'
    });
    ambientLight = new AmbientLight(0x404040);
    light = new DirectionalLight(0xffffff, 1);
    light.position.set(50, 250, 500);
    light.castShadow = true;
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
    renderer.render(scene, camera);
  };

  function addCube() {
    cube = new Mesh(geometry, material);
    cube.matrixAutoUpdate  = false;
    scene.add(cube);
  }

  const clearCube = () => {
    scene.remove(scene.children[0]);
    addCube();
  };

  const getPosition = (coor: number) => {
    // TODO: translate 0-7 edge to coordiate in grid (zero is center of cube);

    return 50;
  };

  const run = ({ setup, players }: IAppState) => {
    clearCube();
    segments = setup.edgeLength;
    children = players
      .filter((p: any) => p.x !== null || !!p.name)
      .map((p: any) => ({ ...p.position, color: p.color, name: p.name }));

    children.forEach((p: any) => {
      const width = config.CUBE_WIDTH / segments;
      const geo = new BoxGeometry(width, width, width);
      const material = new MeshBasicMaterial({ color: p.color });
      const littleCube = new Mesh(geo, material);
      littleCube.name = name;
      littleCube.position.set(getPosition(p.x), getPosition(p.y), getPosition(p.z));
      littleCube.castShadow = true;
      littleCube.receiveShadow = true;
      cube.add(littleCube);
      renderer.render(scene, camera);
    });
  };

  return {
    init,
    run
  };
};

export default (state: any, actions: any) =>
  h('div', {
    id: 'cube-container',
    oncreate: () => {
      actions.initCube(state);
    }
  });
