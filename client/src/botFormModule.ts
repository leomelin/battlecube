import { h, State } from 'hyperapp';
import { form, button } from '@hyperapp/html';
import { IAppState } from './initialState';
import { IActions } from './actions';
import { Input } from './views';
import './form.css';

type Test = [any, string];

export interface IBotFormState {
  isOpen: boolean;
  values: {
    url: string;
    name: string;
    color: string;
  };
  tests: any;
  errors: {
    url: string | null;
    name: string | null;
    color: string | null;
  };
}

export interface ISetFormValue {
  ({ value, id }: { value: string; id: string }): Partial<IBotFormState>;
}

export interface IBotFormActions {
  setFormValue: ISetFormValue;
  toggleForm(): Partial<IBotFormState>;
  validate({ value, id }: { value: string; id: string }): Partial<IBotFormState>;
}

const defaultFormValues = {
  url: 'http://',
  name: '',
  color: ''
};

const minLen = (minLength: number) => (v: string) => v && v.length > minLength;
const urlRegex = /^(http|https):\/\//;
const hasProtocalInUrl = (value: string) => urlRegex.test(value);
const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const isHex = (value: string) => hexRegex.test(value);

const inputConfig = [
  { id: 'url', placeholder: 'http://myboturl', type: 'url' },
  { id: 'name', placeholder: 'Name' },
  { id: 'color', placeholder: 'Color (6 digit hex value)' }
];

export default {
  state: {
    isOpen: false,
    values: defaultFormValues,
    tests: {
      url: [
        [minLen(5), 'A new bot must have a url'],
        [hasProtocalInUrl, 'Must be a valid url']
      ],
      name: [[minLen(1), 'A name is required']],
      color: [[isHex, 'Must be in hex color format #fff']]
    },
    errors: {
      url: null,
      name: null,
      color: null
    }
  },
  actions: {
    setFormValue: (
      state: IBotFormState,
      _a: IBotFormActions,
      { id, value }: { id: string; value: string }
    ) => ({ values: { ...state.values, [id]: value } }),
    toggleForm: (state: IBotFormState) => ({ isOpen: !state.isOpen }),
    validate: (
      state: IBotFormState,
      _a: IBotFormActions,
      { id, value }: any
    ) => {
      return state.tests[id].forEach((test: Test) => {
        if (test[0](value)) {
          return { errors: { [id]: test[1] } };
        }
        return { errors: { [id]: null } };
      });
    }
  }
};

const formInputs = (values: any, actions: IActions) =>
  inputConfig.map((i: any): any =>
    Input({
      ...i,
      value: values[i.id],
      oninput: (e: any) =>
        actions.botForm.setFormValue({ id: e.target.id, value: e.target.value })
    })
  );

export const renderBotForm = (
  { botForm: { values, errors, isOpen } }: IAppState,
  actions: IActions
): any => {
  return form(
    {
      style: { display: isOpen ? 'flex' : 'none' },
      onsubmit: () => {
        return false;
      }
    },
    [...formInputs(values, actions), button({ type: 'submit' }, 'Add bot')]
  );
};
