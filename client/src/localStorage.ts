import { IAppState } from './initialState';

const STORAGE_ID = 'battlecube-storage';

export const persist = (state: any) =>
  localStorage.setItem(STORAGE_ID, JSON.stringify(state));

export const get = () => {
  const promise = new Promise((resolve: Function) => {
    try {
      const data = localStorage.getItem(STORAGE_ID);
      if (data) {
        return resolve(JSON.parse(data));
      } else {
        return resolve(null);
      }
    } catch (error) {
      console.error('Error retrieving data from locale storage', error);
      resolve(null);
    }
  });
  return promise;
};

export const remove = () => localStorage.removeItem(STORAGE_ID);
