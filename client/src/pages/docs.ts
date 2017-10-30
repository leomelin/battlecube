import { h } from 'hyperapp';
import { main, h1, article } from '@hyperapp/html';
import { IAppState } from '../initialState';
import '../styles/docs.css';

export default (state: IAppState) =>
  main({ className: 'docs' }, [
    article({ oncreate: (e: any) => (e.innerHTML = state.docs) }, '')
  ]);
