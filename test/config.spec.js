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

      expect(findItem(fixtureBefore)).toMatchSnapshot()
      expect(findItem(fixtureAfter)).toMatchSnapshot()
    });
  });
});
