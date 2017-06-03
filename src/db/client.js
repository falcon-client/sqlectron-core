// @flow
import CassandraProviderFactory from './provider_clients/CassandraProviderFactory';
import SqliteProviderFactory from './provider_clients/SqliteProviderFactory';
import type { ProviderInterface, serverType, databaseType } from './provider_clients/ProviderInterface';

export default function Client(server: serverType, database: databaseType): ProviderInterface {
  switch (server.config.client) {
    case 'sqlite':
      return SqliteProviderFactory(server, database);
    case 'cassandra':
      return CassandraProviderFactory(server, database);
    default:
      throw new Error(`Database client type "${server.config.client}" not recognized`);
  }
}
