import { IAppState } from './initialState';
import { IActions } from './actions';

const STORAGE_ID = 'battlecube-storage';

const store = {
  set: (state: any) => {
    return Promise.resolve().then(() => {
      localStorage.setItem(STORAGE_ID, JSON.stringify(state));
    });
  },
  get: () => {
    return Promise.resolve().then(() => {
      const state = localStorage.getItem(STORAGE_ID);
      if (state) return JSON.parse(state);
      return {};
    });
  },
  remove: () => {
    return Promise.resolve().then(() => {
      localStorage.removeItem(STORAGE_ID);
      return {};
    });
  }
};

const storageActions = {
  persistState: (state: IAppState) => (update: Function) => {
    update((state: IAppState) => {
      const { players, setup } = state;
      store.set({ players, setup });
      return state;
    });
  },

  getPersistedState: () => async (state: IAppState) => {
    const retrievedState = await store.get();
    return { ...state, ...retrievedState };
  },

  removePersistedState: () => store.remove()
};

const actionsOnWhichToPersist = ['addPlayer', 'removePlayer', 'recordWin'];

const logSaveMessage = () => console.log('State persisted to locale storage');

const handleUpdate = (state: IAppState, result: IAppState) => {
  const updatedState = Object.assign({}, state, result);
  store
    .set(updatedState)
    .then(logSaveMessage);
};

export default (app: any) => {
  return async (props: any, root: any) => {
    const persistedState = await store.get();
    if (persistedState) {
      Object.assign(props.state, persistedState);
    }
    function enhanceActionsToPeristData(actions: IActions) {
      return Object.keys(actions || {}).reduce((enhancedActions: any, name) => {
        const action = actions[name];
        enhancedActions[name] = (
          state: IAppState,
          actions: IActions,
          data: any
        ) => {
          const result = action(state, actions, data);
          if (typeof result === 'function') {
            return (update: Function) => {
              return result((withState: any) => {
                if (actionsOnWhichToPersist.indexOf(name) > -1) {
                  handleUpdate(state, result);
                }
                return update(withState);
              });
            };
          } else {
            if (actionsOnWhichToPersist.indexOf(name) > -1) {
              handleUpdate(state, result);
            }
            return result;
          }
        };
        return enhancedActions;
      }, {});
    }

    window.addEventListener('unload', () => {
      props.actions.persistState();
      logSaveMessage();
    });

    // add storage actions...yeah, probably not supposed to mutate state this way ;)
    Object.assign(props.actions, storageActions);
    // presently does not enhance actions of modules
    props.actions = enhanceActionsToPeristData(props.actions);
    return app(props, root);
  };
};
