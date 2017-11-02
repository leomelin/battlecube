import { h } from 'hyperapp';
import { main, h1, article, div } from '@hyperapp/html';
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
  main(
    {
      className: 'docs'
    },
    getDocs(docs)
  );
