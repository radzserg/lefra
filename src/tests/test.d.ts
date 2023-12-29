/* eslint-disable no-var, vars-on-top */

import { DatabasePool } from 'slonik';

declare namespace globalThis {
  var createTestPool: () => Promise<DatabasePool>;
}
