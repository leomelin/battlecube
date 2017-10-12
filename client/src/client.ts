import { app, h } from 'hyperapp';
import './client.css';
import initialState, { GameStatus, IAppState } from './initialState';
import { LogItem, Slider } from './views';
import actions, { IActions } from './actions';
import Cube from './createCube';

const appActions: any = app({
  actions,
  state: { ...initialState },
  view: (state: IAppState, actions: IActions) =>
    h('main', {}, [
      h('h1', {}, 'Battlecube'),
      h('label', {}, `Speed: ${state.sliderSpeedValue} ms`),
      Slider(state, actions),
      h(
        'button',
        {
          disabled: state.gameStatus === GameStatus.started,
          onclick: () => actions.start()
        },
        'Start game'
      ),
      Cube(state, actions),
      h(
        'div',
        {
          className: 'log',
          style: { display: state.log.length < 1 ? 'none' : 'flex' }
        },
        [h('ul', {}, state.log.map(LogItem(state.players)))]
      )
    ]),
  root: document.getElementById('app')
});

appActions.updateGameStatus();
appActions.log();
