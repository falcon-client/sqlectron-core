// @flow
import { createConnection } from './Client';
import { CLIENTS } from './clients';

type databaseType = {
  database: string,
  connection: null,
  connecting: bool,
  disconnect: () => void
};

type serverType = {
  db: { [dbName: string]: databaseType } | {},
  sshTunnel?: { close: () => void } | null
};

/**
 * Create and persist a server session. Returns a server
 * object that contains this state.
 */
export function createServer(serverConfig: Object) {
  if (!serverConfig) {
    throw new Error('Missing server configuration');
  }

  if (!CLIENTS.some(cli => cli.key === serverConfig.client)) {
    throw new Error('Invalid SQL client');
  }

  const server: serverType = {
    /**
     * All connected dbs. This is the 'connection pool'
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

    /**
     * Retrieve the database connection pool if it exists
     * @TODO: Use use Map as dictionary instead of object literal
     */
    db(dbName: string): databaseType {
      if (dbName in server.db) {
        return server.db[dbName];
      }
      throw new Error('DB does not exist in databse connection pool');
    },

    /**
     * Kill the server and close the ssh tunnel
     */
    end() {
      // disconnect from all DBs
      Object.keys(server.db).forEach(key => server.db[key].disconnect());

      // close SSH tunnel
      if (server.sshTunnel) {
        server.sshTunnel.close();
        server.sshTunnel = null;
      }
    },

    /**
     * After the server session has been created, connect to a given
     * database
     */
    createConnection(dbName: string): databaseType {
      // If connection to database already exists in pool, return int
      if (server.db[dbName]) {
        return server.db[dbName];
      }

      const database = {
        database: dbName,
        connection: null,
        connecting: false
      };

      // Add the connection to the 'connection pool'
      server.db[dbName] = (createConnection(server, database): databaseType);

      return server.db[dbName];
    }
  };
}

export default createServer;
