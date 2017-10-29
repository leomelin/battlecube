import { h } from 'hyperapp';
import { form, button } from '@hyperapp/html';
import { IAppState } from '../initialState';
import { IActions } from '../actions';
import { Input } from '../partials';
import { PlayerStatus } from '../initialState';
import '../styles/form.css';
import { minLen, hasProtocalInUrl, isHex } from '../helpers';

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
    [key: string]: any;
  };
}

export interface ISetFormValue {
  ({ value, id }: { value: string; id: string }): Partial<IBotFormState>;
}

export interface IBotFormActions {
  setFormValue: ISetFormValue;
  toggleForm(): Partial<IBotFormState>;
  validate({
    value,
    id
  }: {
    value: string;
    id: string;
  }): Partial<IBotFormState>;
  clearForm(): Partial<IBotFormState>;
}

const defaultFormValues = {
  url: 'http://',
  name: '',
  color: ''
};

const inputConfig = [
  { id: 'url', placeholder: 'http://myboturl', type: 'url' },
  { id: 'name', placeholder: 'Name' },
  { id: 'color', placeholder: 'Color (6 digit hex value)' }
];

export const formActions = {
  setFormValue: (
    state: IBotFormState,
    _a: IBotFormActions,
    { id, value }: { id: string; value: string }
  ) => ({ values: { ...state.values, [id]: value } }),

  clearForm: () => ({ values: defaultFormValues }),

  toggleForm: (state: IBotFormState) => ({ isOpen: !state.isOpen }),

  validate: (_s: IBotFormState, _a: IBotFormActions, { id, value }: any) => (
    update: any
  ) => {
    update((state: IBotFormState) => {
      const error = state.tests[
        id
      ].reduce((errorMessage: string, test: Test) => {
        if (!test[0](value)) {
          return test[1];
        }
        return errorMessage;
      }, null);
      return { errors: { [id]: error } };
    });
  }
};

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
      color: [[isHex, 'Must be in hex color format #fff000']]
    },
    errors: {
      url: null,
      name: null,
      color: null
    }
  },
  actions: formActions
};

const formInputs = (values: any, errors: any, actions: IActions) =>
  inputConfig.map((i: any): any =>
    Input({
      ...i,
      value: values[i.id],
      oninput: (e: any) => {
        actions.botForm.validate({ id: e.target.id, value: e.target.value });
        actions.botForm.setFormValue({
          id: e.target.id,
          value: e.target.value
        });
      },
      error: errors[i.id]
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
        const isValid = Object.keys(
          errors
        ).reduce((isValid: boolean, id: string): boolean => {
          if (errors[id]) {
            return false;
          }
          return isValid;
        }, true);
        if (isValid) {
          const newPlayer = {
            ...values,
            status: PlayerStatus.inactive,
            position: { x: null, y: null, z: null },
            wins: 0
          };
          actions.addPlayer(newPlayer);
          actions.botForm.clearForm();
          actions.botForm.toggleForm();
        }
        return false;
      }
    },
    [
      ...formInputs(values, errors, actions),
      button({ type: 'submit' }, 'Add bot')
    ]
  );
};
