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

export type exportOptionsType = {
  views?: Array<string>,
  procedures?: Array<string>,
  functions?: Array<string>,
  rows?: Array<string>,
} &
({ tables: Array<string> } | { table: string });

export type databaseType = {
  database: string,
  connection: {
    getQuerySelectTop: (table: string, limit: number, schema: string) => void,
    listTableColumns: (table: string) => Array<Object>,
    wrapIdentifier: (item: any) => any,
    disconnect: () => void
  } | null,
  connecting: bool
};

type listTablesType = Promise<Array<{name: string}>>;

export type queryType = {
  execute: () => void,
  cancel: () => void,
};

export type queryArgsType = {
  query: string,
  multiple?: bool,
  params?: Array<string>
};

export type queryResponseType = {
  command: string,
  rows: Array<Object>,
  fields: Array<Object>,
  rowCount: number,
  affectedRows: number,
};

/**
 * @TODO: Add documentation for each of these methods
 */
export interface ProviderInterface {
  /**
   * Database config properties
   */
  server: serverType,
  database: databaseType,

  /**
   * @TODO: What does this to? What is an identifier?
   */
  wrapIdentifier: (value: string) => string,

  /**
   * Connection operations:
   *
   * Create a connection to a database using `this.server.config` that is passed
   * from ProviderFactory constructor -> BaseProvider constructor
   */
  connect: () => void,
  disconnect: () => void,

  /**
   * List operations:
   */
  listTables: () => listTablesType,
  listViews: () => Promise<Array<string>>,
  listRoutines: () => Promise<Array<string>>,
  listTableTriggers: (table: string) => Promise<Array<string>>,
  listTableIndexes: (database: string, table: string) => Promise<Array<string>>,
  listSchemas: () => Promise<Array<string>>,
  listDatabases: () => Promise<Array<string>>,
  listTableColumns: (table: string) => Promise<Array<{
    columnName: string,
    dataType: string
  }>>,

  /**
   * Retrival operations
   */
  getVersion: () => Promise<string>,
  getConnectionType: () => Promise<'local' | 'ssh' | 'insecure'>,
  getTableReferences: (table: string) => Promise<Array<string>>,
  getTableValues: (table: string) => Promise<Array<Object>>,
  getTableNames: () => Promise<Array<string>>,
  getTableKeys: (table: string) => Promise<Array<{
    constraintName: string,
    columnName: string,
    referencedTable: string,
    keyType: string
  }>>,

  /**
   * @TODO: Basic CRUD Operations. Given a database name, table name, dynamically
   *        generate a query string from the given properties of the table. Perform
   *        any necessary bookkeeping and validation
   */
  create: (database: string, table: string, objectToInsert: Object) => Promise<bool>,
  read: (database: string, table: string, objectToInsert: Object) => Promise<bool>,
  update: (database: string, table: string, objectToInsert: Object) => Promise<bool>,
  delete: (database: string, table: string, objectToInsert: Object) => Promise<bool>,

  /**
   * @TODO: What is the difference between query() driverExecuteQuery() and executeQuery()?
   */
  query: (queryText: string) => Promise<{ execute: () => Promise<any>, cancel: () => void }>,
  executeQuery: (queryText: string) => Promise<Array<queryResponseType>>,
  driverExecuteQuery: (queryArgs: queryArgsType) => Promise<{data: Array<Object>}>,

  /**
   * Create a JSON or CSV buffer to export the database to
   */
  getJsonString: (exportOptions: exportOptionsType) => Promise<string>,
  getCsvString: (exportOptions: exportOptionsType) => Promise<string>,
  exportJson: (exportOptions: exportOptionsType, absolutePath: string) => Promise<string>,
  exportCsv: (exportOptions: exportOptionsType, absolutePath: string) => Promise<string>,

  /**
   * Run a query inside of an existing connection pool
   */
  runWithConnection: (query: () => queryResponseType) => void,

  /**
   * Determine if the connection is still alive and the database is still conencted
   * to
   */
  isOnline: () => Promise<bool>,

   /**
    * The following methods return sql query statements that are specific to the
    * currently connected database
    *
    * @TODO: All the following API methods should return strings
    *        If returns a string currently, manually create a promise out of it
    */
  getQuerySelectTop: (table: string, limit: number) => (Promise<string> | string),
  getTableCreateScript: (table: string, schema?: string) => (Promise<string> | string),
  getTableSelectScript: (table: string, schema?: string) => (Promise<string> | string),
  getTableInsertScript: (table: string, schema?: string) => (Promise<string> | string),
  getTableUpdateScript: (table: string, schema?: string) => (Promise<string> | string),
  getTableDeleteScript: (table: string, scheme?: string) => (Promise<string> | string),
  getViewCreateScript: (view: string) => (Promise<string> | string),
  getRoutineCreateScript: (routine: string, schema: string) => (Promise<string> | string),
  truncateAllTables: () => (Promise<string> | string)
}

export type FactoryType = Promise<ProviderInterface>;
