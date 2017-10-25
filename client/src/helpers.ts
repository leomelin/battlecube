import initialState, {IAppState} from './initialState';

export const minLen = (minLength: number) => (v: string) => v && v.length > minLength;
const urlRegex = /^(http|https):\/\//;
export const hasProtocalInUrl = (value: string) => urlRegex.test(value);
const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
export const isHex = (value: string) => hexRegex.test(value);

export const pick = (names: string[], obj: any) => {
  const result: any = {};
  let idx = 0;
  while (idx < names.length) {
    if (names[idx] in obj) {
      result[names[idx]] = obj[names[idx]];
    }
    idx += 1;
  }
  return result;
};

const isMissingRequiredKeys = (keyList: string[], state: IAppState) => {
  const existingKeys = Object.keys(state);
  return keyList.reduce((acc, key) => !existingKeys.includes(key) || acc  , false);
};

export const isValidSetupAndPlayersState = (state: any) => {
  const requiredSetupKeys = Object.keys(initialState.setup);
  if (typeof state !== 'object') {
    return false;
  }
  if (!state.players || Object.prototype.toString.call(state.players) !== '[object Array]') {
    return false;
  }
  if (!state.setup || isMissingRequiredKeys(requiredSetupKeys, state.setup)) {
    return false;
  }
  return true;
};
