## Local Dev Setup
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

## Pulishing
```bash
npm i -g np
np
```
