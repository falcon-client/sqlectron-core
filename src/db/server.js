// @flow
import { createConnection } from './Client';
import { CLIENTS } from './clients';

export function createServer(serverConfig: Object) {
  if (!serverConfig) {
    throw new Error('Missing server configuration');
  }

  if (!CLIENTS.some(cli => cli.key === serverConfig.client)) {
    throw new Error('Invalid SQL client');
  }

  const server = {
    /**
     * All connected dbs
     */
    db: {},

    config: {
      ...serverConfig,
      host: serverConfig.host || serverConfig.socketPath
    }
  };

  /**
  * Server public API
  */
  return {
    db(dbName: string) {
      return server.db[dbName];
    },

    end() {
      // disconnect from all DBs
      Object.keys(server.db).forEach(key => server.db[key].disconnect());

      // close SSH tunnel
      if (server.sshTunnel) {
        server.sshTunnel.close();
        server.sshTunnel = null;
      }
    },

    createConnection(dbName: string) {
      if (server.db[dbName]) {
        return server.db[dbName];
      }

      const database = {
        database: dbName,
        connection: null,
        connecting: false
      };

      server.db[dbName] = createConnection(server, database);

      return server.db[dbName];
    }
  };
}

export default createServer;
