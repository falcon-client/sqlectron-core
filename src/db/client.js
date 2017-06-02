// @flow
import CassandraProviderFactory from './provider_clients/CassandraProviderFactory';
import type { ProviderInterface } from './provider_clients/ProviderInterface';

export default function Client(server: Object, database: Object): ProviderInterface {
  return CassandraProviderFactory(server, database);
}
