/* tslint:disable */
import { h } from 'hyperapp';
import { ILogItem, MessageType, GameStatus, IAppState } from './initialState';

interface IItem {
  [key: string]: Function;
}

const TICK_SEPARATOR =
  '***************************************************************************************';
const RESULTS_SEPARATOR =
  '########################################################';

const Item: IItem = {
  normal: ({ name, message }: ILogItem) => [
    h(
      'span',
      { className: `log-item__${name}`, key: `${Math.random()}` },
      `${name}: `
    ),
    h('span', { className: 'log-item__message' }, message)
  ],
  special: ({ message, name }: ILogItem) => [
    h('span', { className: `log-item__special-message` }, `${message}: `),
    h('span', { className: `log-item__${name}` }, name)
  ],
  tick: ({ message }: ILogItem) => [
    h('div', { className: 'log-item__separator' }, TICK_SEPARATOR),
    h(
      'div',
      { className: `log-item__tick-message__current-tick` },
      message.currentTick
    ),
    h(
      'div',
      { className: `log-item__tick-message__current-players` },
      message.currentPlayers
    ),
    h('div', { className: 'log-item__separator' }, TICK_SEPARATOR)
  ],
  result: ({ message }: ILogItem) => [
    h('div', { className: 'log-item__separator' }, RESULTS_SEPARATOR),
    h('div', { className: `log-item__final-message__winner` }, message.winner),
    h('div', { className: `log-item__final-message__scores` }, message.scores),
    h('div', { className: 'log-item__separator' }, RESULTS_SEPARATOR)
  ]
};

export const LogItem = (item: ILogItem) => {
  const type = MessageType[item.type || 0];
  const children = Item[type];
  return h(
    'li',
    { className: `log-item ${item.type ? MessageType[item.type] : 'normal'}` },
    children(item)
  );
};

export const Slider = (state: IAppState, actions: any) =>
  h('div', { className: 'slider-wrap' }, [
    h(
      'input',
      {
        className: 'slider',
        type: 'range',
        min: '10',
        max: '2000',
        step: '10',
        value: state.setup.speed,
        disabled: state.gameStatus === GameStatus.started,
        onchange: (e: any) => actions.setup.updateSpeed(e.target.value)
      },
      []
    ),
    h('div', { className: 'sliderbar' })
  ]);
