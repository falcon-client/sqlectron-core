// @flow
export interface ProviderInterface {
  wrapIdentifier: (value: string) => string,
  disconnect: () => void,
  listTables: () => Promise<Array<Object>>,
  listViews: () => Promise<Array<Object>>,
  listRoutines: () => Promise<Array<Object>>,
  listTableColumns: (db: string, table: string) => Promise<Array<Object>>,
  listTableTriggers: (table: string) => Promise<Array<Object>>,
  listTableIndexes: (db: string, table: string) => Promise<Array<Object>>,
  listSchemas: () => Promise<Array<Object>>,
  getTableReferences: (table: string) => Promise<Array<Object>>,
  getTableKeys: (table: string) => Promise<Array<Object>>,
  getTableValues: (db: string, table: string) => Promise<Array<Object>>,
  insert: (
    database: string,
    table: string,
    objectToInsert: Object
  ) => Promise<Array<Object>>,
  query: (queryText: string) => Promise<Array<Object>>,
  executeQuery: (queryText: string) => Promise<Array<Object>>,
  listDatabases: () => Promise<Array<Object>>,
  getQuerySelectTop: (table: string, limit: number) => string,
  getTableCreateScript: (table: string) => Promise<Array<Object>>,
  getTableSelectScript: (table: string) => Promise<Array<Object>>,
  getTableInsertScript: (table: string) => Promise<Array<Object>>,
  getTableUpdateScript: (table: string) => Promise<Array<Object>>,
  getTableDeleteScript: (table: string) => Promise<Array<Object>>,
  getViewCreateScript: (view: string) => Promise<Array<Object>>,
  getRoutineCreateScript: (routine: string) => Promise<Array<Object>>,
  truncateAllTables: (database: string) => Promise<Array<Object>>
}
