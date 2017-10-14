import { app, h } from 'hyperapp';
import { div, h1, main, label, button } from '@hyperapp/html';
import './client.css';
import initialState, { GameStatus, IAppState } from './initialState';
import { LogItem, Slider } from './views';
import actions, { IActions } from './actions';
import Cube from './Cube';

const appActions: any = app({
  actions,
  state: { ...initialState },
  view: (state: IAppState, actions: IActions) =>
    main({}, [
      h1({}, 'Battle³'),
      label({}, `Speed: ${state.sliderSpeedValue} ms`),
      Slider(state, actions),
      button(
        {
          disabled: state.gameStatus === GameStatus.started,
          onclick: () => actions.start()
        },
        'Start game'
      ),
      Cube(state, actions),
      h('pre', {style: {color: 'white'}}, JSON.stringify(state.players, null, 2)),
      div(
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
