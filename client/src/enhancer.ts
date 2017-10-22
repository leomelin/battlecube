import { IAppState } from './initialState';
import { IActions } from './actions';
import mitt, { Emitter } from 'mitt';

const emitter: Emitter = new mitt();

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

const actionsToSyncWithStorage = [
  'addPlayer',
  'removePlayer',
  'recordWin',
  'setup.updateSpeed',
  'setup.up',
  'setup.down'
];

const logSaveMessage = () =>
  console.log('Synced state change with locale storage');

const handleUpdate = (
  actionName: string,
  state: IAppState,
  result: IAppState
) => {
  const [prefix, nestedAction] = actionName.split('.');
  if (nestedAction) {
    store.get().then((data: IAppState) => {
      const update = Object.assign({}, data[prefix], result);
      const newData = Object.assign({}, data, { [prefix]: update });
      return store.set(newData).then(logSaveMessage);
    });
  }
  const { players, setup } = Object.assign({}, state, result);
  store.set({ players, setup }).then(logSaveMessage);
};

function enhanceActionsToSyncWithStorage(
  actions: IActions,
  emit: any,
  prefix = ''
) {
  const namespace = prefix.length > 0 ? `${prefix}.` : '';
  return Object.keys(actions || {}).reduce((enhancedActions: any, name) => {
    const namespacedName = `${namespace}${name}`;
    const action = actions[name];
    enhancedActions[name] =
      typeof action === 'function'
        ? (state: IAppState, actions: IActions, data: any) => {
            const result = action(state, actions, data, emit);
            if (typeof result === 'function') {
              return (update: Function) => {
                return result((withState: any) => {
                  if (actionsToSyncWithStorage.indexOf(namespacedName) > -1) {
                    handleUpdate(namespacedName, state, result);
                  }
                  return update(withState, emit);
                });
              };
            } else {
              if (actionsToSyncWithStorage.indexOf(namespacedName) > -1) {
                handleUpdate(namespacedName, state, result);
              }
              return result;
            }
          }
        : enhanceActionsToSyncWithStorage(action, emit, namespacedName);
    return enhancedActions;
  }, {});
}

function enhanceModuleActionsToSyncWithStorage(modules: any, emit: any) {
  return Object.keys(
    modules || {}
  ).reduce((newModules: any, moduleName: any) => {
    const module = modules[moduleName];
    newModules[moduleName] = module;
    newModules[moduleName].actions = enhanceActionsToSyncWithStorage(
      module.actions,
      emit
    );
    return newModules;
  }, {});
}

export default (app: any) => {
  return async (props: any, root: any) => {
    const persistedState = await store.get();

    if (persistedState) {
      Object.assign(props.state, persistedState, { emitter });
    }

    // add storage actions...yeah, probably not supposed to mutate actions this way
    Object.assign(props.actions, storageActions, {__emit: (
      state: IAppState,
      actions: IActions,
      { name, data }: { name: string; data: object }
    ) => {
      if (props.events[name]) {
        emitter.emit(name, props.events[name](state, actions, data));
      }
      emitter.emit(name, data);
    }});

    let _emit = (data: any) => {};

    const emit = (message: { name: string, data: any }) => _emit(message);

    props.actions = enhanceActionsToSyncWithStorage(props.actions, emit);

    // presently does not enhance child modules of modules
    props.modules = enhanceModuleActionsToSyncWithStorage(props.modules, emit);

    window.addEventListener('unload', () => {
      props.actions.persistState();
      logSaveMessage();
    });

    const appActions = app(props, root);
    _emit = appActions.__emit;
    return appActions;
  };
};
