import { IAppState } from './initialState';
import { IActions } from './actions';
import { pick } from './helpers';
import mitt, { Emitter } from 'mitt';

const emitter: Emitter = new mitt();

const STORAGE_ID = 'battlecube-storage';

const makeStore = (includedState: string[]) => ({
  set: (state: any) => {
    const sliceToSave = pick(includedState, state);
    return Promise.resolve().then(() => {
      localStorage.setItem(STORAGE_ID, JSON.stringify(sliceToSave));
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
});

const logSaveMessage = () =>
  console.log('Synced state change with locale storage');

interface IEnhancerOptions {
  syncedActions?: string[];
  syncedState?: string[];
  stateValidator?: Function;
  disablePersistence?: boolean;
}

export default (app: any, opts: IEnhancerOptions) => {
  const actionsToSyncWithStorage =
    opts.syncedActions && !opts.disablePersistence ? opts.syncedActions : [];
  const stateSlice = opts.syncedState || [];
  const alwaysTrue = () => true;
  const isValidStore = opts.stateValidator || alwaysTrue;
  const store = makeStore(stateSlice);
  const disable = opts.disablePersistence || false;

  const storageActions = {
    persistState: (state: IAppState) => (update: Function) => {
      update((state: IAppState) => {
        store.set(state);
        return state;
      });
    },

    getPersistedState: () => async (state: IAppState) => {
      const retrievedState = await store.get();
      return { ...state, ...retrievedState };
    },

    removePersistedState: () => store.remove()
  };

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
    syncedActions: string[],
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
                    if (syncedActions.indexOf(namespacedName) > -1) {
                      handleUpdate(namespacedName, state, result);
                    }
                    return update(withState, emit);
                  });
                };
              } else {
                if (syncedActions.indexOf(namespacedName) > -1) {
                  handleUpdate(namespacedName, state, result);
                }
                return result;
              }
            }
          : enhanceActionsToSyncWithStorage(
              action,
              syncedActions,
              emit,
              namespacedName
            );
      return enhancedActions;
    }, {});
  }

  function enhanceModuleActionsToSyncWithStorage(
    modules: any,
    syncedActions: string[],
    emit: any
  ) {
    return Object.keys(
      modules || {}
    ).reduce((newModules: any, moduleName: any) => {
      const module = modules[moduleName];
      newModules[moduleName] = module;
      newModules[moduleName].actions = enhanceActionsToSyncWithStorage(
        module.actions,
        syncedActions,
        emit
      );
      return newModules;
    }, {});
  }

  return async (props: any, root: any) => {
    const persistedState = await store.get();

    if (persistedState && isValidStore(persistedState) && !disable) {
      Object.assign(props.state, persistedState, {
        sliderSpeedValue: persistedState.setup.speed
      });
    }

    Object.assign(props.actions, storageActions, {
      __emit: (
        state: IAppState,
        actions: IActions,
        { name, data }: { name: string; data: object }
      ) => {
        if (props.events[name]) {
          emitter.emit(name, props.events[name](state, actions, data));
        }
        emitter.emit(name, data);
      }
    });

    let _emit = (data: any) => {};

    const emit = (message: { name: string; data: any }) => _emit(message);

    props.actions = enhanceActionsToSyncWithStorage(
      props.actions,
      actionsToSyncWithStorage,
      emit
    );

    // presently does not enhance child modules of modules
    props.modules = enhanceModuleActionsToSyncWithStorage(
      props.modules,
      actionsToSyncWithStorage,
      emit
    );

    const appActions = app(props, root);

    _emit = appActions.__emit;

    window.addEventListener('unload', () => {
      appActions.persistState();
      logSaveMessage();
    });

    return appActions;
  };
};
