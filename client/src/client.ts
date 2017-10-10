import { app, h } from 'hyperapp';
import './client.css';
import initialState, { GameStatus, IAppState } from './initialState';
import { LogItem, Slider } from './views';
import actions, { IActions } from './actions';

const appActions: any = app({
  actions,
  state: { ...initialState },
  view: (state: IAppState, actions: IActions) =>
    h('main', {}, [
      h('h1', {}, 'Battlecube'),
      h(
        'div',
        {
          oncreate: appActions.drawCube,
          className: 'canvas-3d',
          style: { width: '500px', height: '500px' }
        }
      ),
      h('label', {}, `Speed: ${state.setup.speed} ms`),
      Slider(state, actions),
      h(
        'button',
        {
          disabled: state.gameStatus === GameStatus.started,
          onclick: () => actions.start()
        },
        'Start game'
      ),
      h(
        'div',
        {
          className: 'log',
          style: { display: state.log.length < 1 ? 'none' : 'flex' }
        },
        [h('ul', {}, state.log.map(LogItem))]
      )
    ]),
  root: document.getElementById('app')
});

appActions.updateGameStatus();
appActions.log();
