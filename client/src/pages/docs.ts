import { h } from 'hyperapp';
import { div, article, div } from '@hyperapp/html';
import { IAppState } from '../initialState';
import '../styles/docs.css';
import { IActions } from '../actions';
import '../styles/spinner.css';

const getDocs = (docs: string) => {
  if (!docs || !docs.length) {
    return [
      div({ className: 'docs-loading' }, [div({ className: 'spinner' }, [])])
    ];
  }
  return [article({ oncreate: (e: any) => (e.innerHTML = docs) }, '')];
};

export default ({ docs }: IAppState, { setDocs }: IActions) =>
  div(
    {
      className: 'docs'
    },
    getDocs(docs)
  );
