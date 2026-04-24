import * as initial from './00001_initial';
import * as flashLoc from './0002_flash_guides_native_localization';

export const migrations = [
  {
    up: initial.up,
    down: initial.down,
    name: '00001_initial',
  },
  {
    up: flashLoc.up,
    down: flashLoc.down,
    name: '0002_flash_guides_native_localization',
  },
];
