import { h } from 'hyperapp';
import { main, h1, article, div } from '@hyperapp/html';
import { IAppState } from '../initialState';
import '../styles/docs.css';
import { IActions } from '../actions';
import marked from 'marked';
import '../styles/spinner.css';

const DOCS_PATH = './docs.md';

const handleErrors = (res: any) => {
  if (!res.ok) throw Error(res.statusText);
  return res;
};

const fetchMarkdown = () =>
  fetch(DOCS_PATH)
    .then(handleErrors)
    .then(data => data.text())
    .then(marked);

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
      className: 'docs',
      oncreate: () => {
        if (!docs) {
          fetchMarkdown().then(setDocs);
        }
      }
    },
    getDocs(docs)
  );
