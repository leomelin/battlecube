import { IAppState, IPlayer } from './initialState';
import { IActions } from './actions';
import { zipWith, sortByProp } from './helpers';

const scoreZipper = (player: IPlayer, update: any) => {
  player.score = player.score + update.highScore;
  return player;
};

export default {
  addPlayer: (state: IAppState, _a: IActions, player: IPlayer) => ({
    players: [...state.players, player]
  }),

  removePlayer: (state: IAppState, actions: IActions, index: number) => {
    const players = [
      ...state.players.slice(0, index),
      ...state.players.slice(index + 1)
    ];
    return { ...state, players };
  },

  recordWin: (state: IAppState, action: IActions, name: string) => (
    update: Function
  ) => {
    update((newState: IAppState) => {
      const players = state.players.map((p: IPlayer) => {
        const wins = p.name === name ? p.wins + 1 : p.wins;
        return { ...p, wins };
      });

      return { ...newState, players };
    });
  },

  clearScores: ({ players }: IAppState) => {
    const clearedPlayers = players.map((p: IPlayer) => ({
      ...p,
      wins: 0,
      score: 0
    }));
    return { players: clearedPlayers };
  },

  recordScores: (state: IAppState, action: IActions, scores: any) => {
    const sortedScores = sortByProp('name', scores);
    const sortedPlayers = sortByProp('name', state.players);
    const updatedPlayers = zipWith(scoreZipper, sortedPlayers, sortedScores);
    return { players: updatedPlayers };
  }
};
