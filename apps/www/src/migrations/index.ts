import * as initial from './00001_initial';
import * as flashLoc from './0002_flash_guides_native_localization';
import * as legalSeed from './0003_legal_pages_seed';
import * as resetRequestedAt from './0004_users_reset_password_requested_at';

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
  {
    up: legalSeed.up,
    down: legalSeed.down,
    name: '0003_legal_pages_seed',
  },
  {
    up: resetRequestedAt.up,
    down: resetRequestedAt.down,
    name: '0004_users_reset_password_requested_at',
  },
];
