// @flow
export type ClientType = {
  disconnect: () => Promise<any>,
  listTables: () => Promise<any>,
  listViews: () => Promise<any>,
  listRoutines: () => Promise<any>,
  listTableColumns: (db, table: string) => Promise<any>,
  listTableTriggers: (table: string) => Promise<any>,
  listTableIndexes: (db, table: string) => Promise<any>,
  listSchemas: () => Promise<any>,
  getTableReferences: (table: string) => Promise<any>,
  getTableKeys: (db, table: string) => Promise<any>,
  query: (queryText: string) => Promise<any>,
  executeQuery: (queryText: string) => Promise<any>,
  listDatabases: () => Promise<any>,
  getQuerySelectTop: (table: string, limit: number) => Promise<any>,
  getTableCreateScript: (table: string) => Promise<any>,
  getViewCreateScript: (view) => Promise<any>,
  getRoutineCreateScript: (routine) => Promise<any>,
  truncateAllTables: () => Promise<any>
};
