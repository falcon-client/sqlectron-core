// @flow
import type { sshTunnelType, tunnelConfigType } from '../Tunnel';

export type serverType = {
  db: {
    [dbName: string]: {}
  },
  sshTunnel: sshTunnelType,
  config: {
    ...tunnelConfigType,
    ssl?: {
      rejectUnauthorized: bool
    },
    client: string,
    user?: string
  }
};

export type databaseType = {
  database: string,
  connection: {
    getQuerySelectTop: (table: string, limit: number, schema: string) => void,
    listTableColumns: (database: string, table: string, schema: string) => Array<Object>,
    wrapIdentifier: (item: any) => any,
    disconnect: () => void
  } | null,
  connecting: bool
};

type listTablesType = Promise<Array<{
  name: string
}>>;

export type queryType = {
  execute: () => void,
  cancel: () => void,
};

export type queryArgsType = {
  query: string,
  multiple?: bool,
  params?: Array<string>
};

export interface ProviderInterface {
  server: serverType,
  database: databaseType,
  wrapIdentifier: (value: string) => string,
  connect: () => void,
  disconnect: () => void,
  listTables: () => listTablesType,
  listViews: () => Promise<Array<string>>,
  listRoutines: () => Promise<Array<string>>,
  listTableColumns: (db: string, table: string) => Promise<Array<string>>,
  listTableTriggers: (table: string) => Promise<Array<string>>,
  listTableIndexes: (db: string, table: string) => Promise<Array<string>>,
  listSchemas: () => Promise<Array<string>>,
  getTableReferences: (table: string) => Promise<Array<Object>>,
  getTableKeys: (database: string, table: string) => Promise<Array<string>>,
  getTableValues: (db: string, table: string) => Promise<Array<Object>>,
  insert: (
    database: string,
    table: string,
    objectToInsert: Object
  ) => Promise<Array<Object>>,
  query: (queryText: string) => Promise<queryType>,
  executeQuery: (queryText: string) => Promise<any>,
  listDatabases: () => Promise<Array<string>>,
  getQuerySelectTop: (table: string, limit: number) => (Promise<string> | string),
  getTableCreateScript: (table: string, schema: string) => (Promise<string> | string),
  getTableSelectScript: (table: string, schema: string) => (Promise<string> | string),
  getTableInsertScript: (table: string, schema: string) => (Promise<string> | string),
  getTableUpdateScript: (table: string, schema: string) => (Promise<string> | string),
  getTableDeleteScript: (table: string, scheme: string) => (Promise<string> | string),
  getViewCreateScript: (view: string) => (Promise<string> | string),
  getRoutineCreateScript: (routine: string) => (Promise<string> | string),
  truncateAllTables: (database: string) => (Promise<string> | string)
}

export type FactoryType = Promise<ProviderInterface>;
