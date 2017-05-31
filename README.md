falcon-core
===========
The cross-database ORM that powers falcon

## Roadmap
* Release 1.0.0
  * Add documentation
  * Add support for sqlite
  * Migrate to Typescript/Flow
  * Refactor to class/interface based architecture
  * Improve error messages
  * Fix/enhance project build configuration
* Release 2.0.0
  * Add support for mysql, mongo, postgres, maria, cassandra

## Setup
```
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
