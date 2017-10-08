import { h, app } from 'hyperapp';
import './client.css';
import initialState, { IAppState, GameStatus } from './initialState';
import { LogItem, Slider } from './views';
import actions from './actions';

const appActions: any = app({
  actions,
  state: { ...initialState },
  view: (state: IAppState, actions) =>
    h('main', {}, [
      h('h1', {}, 'Battlecube'),
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
