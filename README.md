falcon-core
===========
The cross-database ORM that powers [falcon](https://github.com/falcon-client/falcon)

[![Build Status](https://travis-ci.org/falcon-client/falcon-core.svg?branch=master&maxAge=2592)](https://travis-ci.org/falcon-client/falcon-core)
[![Coverage Status](https://coveralls.io/repos/github/falcon-client/falcon-core/badge.svg)](https://coveralls.io/github/falcon-client/falcon-core)
[![NPM version](https://badge.fury.io/js/falcon-core.svg?maxAge=2592)](http://badge.fury.io/js/falcon-core)
[![Dependency Status](https://img.shields.io/david/falcon-client/falcon-core.svg?maxAge=2592)](https://david-dm.org/falcon-client/falcon-core)
[![npm](https://img.shields.io/npm/dm/falcon-core.svg?maxAge=2592)](https://npm-stat.com/charts.html?package=falcon-core)

## Roadmap
### Release 1.0.0
  * Add documentation
  * Add support for sqlite
  * Import databases as json, csv, and sqlite
  * Export databases/tables/rows
  * Migrate to Typescript/Flow
  * Refactor to class/interface based architecture
  * Improve error messages
  * Fix/enhance project build configuration
### Release 2.0.0
  * Add support for mysql, mongo, postgres, maria, cassandra

## Setup
```bash
git clone https://github.com/falcon-client/falcon-core.git
cd falcon-core
yarn
docker-compose up -d

# To run tests, make sure that you have docker, docker-compose, and docker-machine
# See the wiki on how to start docker:
# https://github.com/falcon-client/falcon-core/wiki/Docker

# Run the tests
yarn test
```

## Example
```js
import path from 'path';
import {db, config} from 'falcon-core';

const serverInfo = {
    database: path.join(__dirname, 'demo.sqlite'),
    client: 'sqlite'
};

async function main() {
    const serverSession = db.createServer(serverInfo);
    const connection = await serverSession.createConnection('demo.sqlite');
    await connection.connect(serverInfo);

    // Connection APIs
    console.log(await connection.getTableSelectScript('albums'));
    console.log(await connection.listTables());
    console.log(await connection.listDatabases());
    console.log(await connection.getTableKeys('albums'));
    console.log(await connection.getTableValues('albums'));

    // Export API's
    console.log(await connection.exportJson('/.tmp.json', {
      table: 'users'
    }));
}

main();
```

## Related
* [falcon](https://github.com/falcon-client/falcon)
