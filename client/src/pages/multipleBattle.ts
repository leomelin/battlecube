import { div, main, label, button } from '@hyperapp/html';
import { GameStatus, IAppState, IPlayer } from '../initialState';
import { Slider, Player, ErrorNotification } from '../partials';
import { IActions } from '../actions';
import renderScorePlot from '../visuals/scorePlot';

export default (state: IAppState, actions: IActions): any =>
  main({}, [
    label({}, `Speed: ${state.sliderSpeedValue} ms`),
    Slider(state, actions),
    ErrorNotification(state.error),
    button(
      {
        disabled: state.gameStatus === GameStatus.started,
        onclick: () => actions.startBatch()
      },
      state.remainingGames === 0
        ? 'Run 100 games'
        : `Games played: ${100 - state.remainingGames}`
    ),
    div({}, [renderScorePlot(state, actions)]),
    div(
      { className: 'players' },
      state.players.map((p: IPlayer, index: number) =>
        Player(
          p,
          index,
          state.players.filter(p => p.status === 1).length === 1,
          actions,
          true
        )
      )
    )
  ]);
