/* tslint:disable */
import { h } from 'hyperapp';
import {
  div,
  span,
  ul,
  li,
  input,
  header,
  p,
  button,
  h1,
  h2,
  label,
  aside,
  nav
} from '@hyperapp/html';
import {
  ILogItem,
  MessageType,
  IAppState,
  GameStatus,
  IError,
  ErrorSeverity,
  PlayerStatus,
  IPlayer,
  Page
} from './initialState';
import { IActions } from './actions';
import { isHex } from './helpers';
import './styles/header.css';

interface IItem {
  [key: string]: Function;
}

const TICK_SEPARATOR =
  '***************************************************************************************';
const RESULTS_SEPARATOR =
  '########################################################';

const Item: IItem = {
  normal: ({ name, message }: ILogItem, color: string) => [
    span(
      { className: 'log-item', key: `${Math.random()}`, style: { color } },
      `${name}: `
    ),
    span({ className: 'log-item__message' }, message)
  ],
  special: ({ message, name }: ILogItem) => [
    span({ className: `log-item__special-message` }, `${message}: `),
    span({ className: `log-item__${name}` }, name)
  ],
  tick: ({ message }: ILogItem) => [
    div({ className: 'log-item__separator' }, TICK_SEPARATOR),
    div(
      { className: `log-item__tick-message__current-tick` },
      message.currentTick
    ),
    div(
      { className: `log-item__tick-message__current-players` },
      message.currentPlayers
    ),
    div({ className: 'log-item__separator' }, TICK_SEPARATOR)
  ],
  result: ({ message }: ILogItem) => [
    div({ className: 'log-item__separator' }, RESULTS_SEPARATOR),
    div({ className: `log-item__final-message__winner` }, message.winner),
    div({ className: `log-item__final-message__scores` }, message.scores),
    div({ className: 'log-item__separator' }, RESULTS_SEPARATOR)
  ]
};

export const LogItem = (players: any) => (item: ILogItem) => {
  const type = MessageType[item.type || 0];
  const currentPlayer = players.find((p: any) => p.name === item.name);
  const children = Item[type];
  return li(
    { className: `log-item ${item.type ? MessageType[item.type] : 'normal'}` },
    children(item, currentPlayer ? currentPlayer.color : 'white')
  );
};

export const Slider = (state: IAppState, actions: any) =>
  div({ className: 'slider-wrap' }, [
    input(
      {
        className: 'slider',
        type: 'range',
        min: '0',
        max: '2000',
        step: '10',
        value: state.sliderSpeedValue,
        oninput: (e: any) => actions.showNewSpeedWhileDragging(+e.target.value),
        onchange: (e: any) => actions.setup.updateSpeed(+e.target.value)
      },
      []
    ),
    div({ className: 'sliderbar' })
  ]);

export const Player = (
  player: IPlayer,
  index: number,
  hasWinner: boolean,
  actions: IActions
) => {
  const alive = player.status === 1;
  const statusText =
    alive && hasWinner ? 'winner' : PlayerStatus[player.status];
  return h('player-', { style: { borderLeft: `3px solid ${player.color}` } }, [
    div({}, [
      div({ className: 'player-info', key: 'name' }, [
        p(
          { className: 'player-info__detail' },
          `${player.name} at ${player.url}`
        ),
        p(
          {
            className: 'player-info__detail'
          },
          [
            span({}, 'status: '),
            span(
              { style: { color: alive ? '#55ff55' : 'OrangeRed' } },
              statusText
            )
          ]
        ),
        p({ className: 'player-info__detail' }, `wins: ${player.wins}`)
      ]),
      div({ className: 'player-actions' }, [
        button(
          {
            className: 'btn-small',
            onclick: () => actions.removePlayer(index)
          },
          'Remove bot'
        )
      ])
    ])
  ]);
};

export const Input = ({
  type = 'text',
  value = '',
  id = 'input',
  placeholder = '',
  oninput,
  error
}: any) =>
  div({ className: 'bot-input-group' }, [
    input({
      type,
      id,
      value,
      className: 'bot-input',
      placeholder,
      oninput,
      style: isHex(value) ? { backgroundColor: value } : {}
    }),
    div(
      { className: 'error', style: { display: error ? 'flex' : 'none' } },
      error
    )
  ]);

export const Setup = (state: IAppState, { setup }: IActions): any => {
  return div(
    {
      className: 'settings',
      style: {
        display: state.gameStatus === GameStatus.stopped ? 'flex' : 'none'
      }
    },
    [
      div({ className: 'setting' }, [
        label({}, 'Tick tasks'),
        h2({}, state.setup.numOfTasksPerTick),
        button(
          {
            className: 'settings-button',
            onclick: () => setup.down({ id: 'numOfTasksPerTick' })
          },
          'ー'
        ),
        button(
          {
            className: 'settings-button',
            onclick: () => setup.up({ id: 'numOfTasksPerTick' })
          },
          '＋'
        )
      ]),
      div({ className: 'setting' }, [
        label({}, 'Edge length'),
        h2({}, state.setup.edgeLength),
        button(
          {
            className: 'settings-button',
            onclick: () =>
              setup.down({
                id: 'edgeLength',
                numOfPlayers: state.players.length
              })
          },
          'ー'
        ),
        button(
          {
            className: 'settings-button',
            onclick: () => setup.up({ id: 'edgeLength' })
          },
          '＋'
        )
      ])
    ]
  );
};

export const ErrorNotification = (error: IError) => {
  return aside(
    { className: `notifications ${ErrorSeverity[error.severity]}` },
    [p(error.message)]
  );
};

const links = [
  { type: Page.singleBattle, label: 'Home' },
  // { type: Page.multipleBattle, label: 'Multiple game runner' },
  { type: Page.docs, label: 'Docs' }
];

export const Header = (state: IAppState, changePage: Function) => {
  return header({}, [
    h('header-left-', {}, [
      nav({}, [
        ul(
          {},
          links
            .filter(link => state.currentPage !== link.type)
            .map(link => li({onclick: () => changePage(link.type)}, link.label))
        )
      ])
    ]),
    h('header-center-', {}, [h1({}, 'Battle³')]),
    h('header-right-', {}, [])
  ]);
};
