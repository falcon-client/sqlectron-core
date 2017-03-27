import { expect as chaiExpect } from 'chai';
import { config } from '../src';
import { readJSONFile } from './../src/utils';
import utilsStub from './utils-stub';


function loadConfig() {
  return readJSONFile(utilsStub.TMP_FIXTURE_PATH);
}

describe('config', () => {
  utilsStub.getConfigPath.install({ copyFixtureToTemp: true });

  describe('.prepare', () => {
    it('should include id for those servers without it', async () => {
      const findItem = (data) => data.servers.find((srv) => srv.name === 'without-id');

      const fixtureBefore = await loadConfig();
      await config.prepare();
      const fixtureAfter = await loadConfig();

      chaiExpect(findItem(fixtureBefore)).to.not.have.property('id');
      chaiExpect(findItem(fixtureAfter)).to.have.property('id');
    });
  });
});
