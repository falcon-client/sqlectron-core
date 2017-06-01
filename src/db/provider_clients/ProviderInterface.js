// @flow
export interface ProviderInterface {
  wrapIdentifier: (value: string) => string,
  disconnect: () => void,
  listTables: () => Promise<Array<string>>,
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
  query: (queryText: string) => Promise<Array<Object>>,
  executeQuery: (queryText: string) => Promise<any>,
  listDatabases: () => Promise<Array<string>>,
  getQuerySelectTop: (table: string, limit: number) => (Promise<string> | string),
  getTableCreateScript: (table: string, schema: string) => (Promise<Array<string>> | string),
  getTableSelectScript: (table: string, schema: string) => (Promise<Array<string>> | string),
  getTableInsertScript: (table: string, schema: string) => (Promise<Array<string>> | string),
  getTableUpdateScript: (table: string, schema: string) => (Promise<Array<string>> | string),
  getTableDeleteScript: (table: string, scheme: string) => (Promise<Array<string>> | string),
  getViewCreateScript: (view: string) => Promise<Array<Object>>,
  getRoutineCreateScript: (routine: string) => Promise<Array<Object>>,
  truncateAllTables: (database: string) => Promise<Array<Object>>
}

export type FactoryType = Promise<ProviderInterface>;
