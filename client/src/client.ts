import { app, h } from 'hyperapp';
import { div, h1, main, label, button } from '@hyperapp/html';
import './client.css';
import initialState, { GameStatus, IAppState, IPlayer } from './initialState';
import { LogItem, Slider, Player } from './views';
import actions, { IActions } from './actions';
import Cube from './Cube';

// just updated to Hyperapp 15.1 and the type definitions are not yet in master
// should be there in a few days but until then maybe disable /delete d.ts in node_modules

app(
  {
    actions,
    init: (_s: IAppState, actions: IActions): void => {
      actions.getPersistedState();
      actions.updateGameStatus();
      actions.log();
      window.addEventListener('unload', () => {
        actions.persistState();
      });
    },
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
        div(
          {
            className: 'log',
            style: { display: state.log.length < 1 ? 'none' : 'flex' }
          },
          [h('ul', {}, state.log.map(LogItem(state.players)))]
        ),
        div(
          { className: 'players' },
          state.players.map((p: IPlayer, index: number) =>
            Player(
              p,
              index,
              state.players.filter(p => p.status === 1).length === 1,
              actions
            )
          )
        ),
        button(
          {
            disabled: state.gameStatus === GameStatus.started,
            onclick: () => console.log('TODO')
          },
          'Add bot'
        )
      ])
  },
  document.getElementById('app')
);
