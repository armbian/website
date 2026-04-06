import * as initial from './00001_initial';

export const migrations = [
  {
    up: initial.up,
    down: initial.down,
    name: '00001_initial',
  },
];
