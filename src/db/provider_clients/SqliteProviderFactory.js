// @flow
import sqlite3 from 'sqlite3';
import { identify } from 'sql-query-identifier';
import createLogger from '../../Logger';
import BaseProvider from './BaseProvider';
import type {
  ProviderInterface,
  FactoryType,
  serverType,
  exportOptionsType,
  queryType,
  queryResponseType,
  databaseType
} from './ProviderInterface';

type queryArgsType = {
  query: string,
  multiple?: bool,
  params?: Array<string>
};

type connectionType = {
  dbConfig: {
    database: string
  },
  run: (queryText: string, args?: Array<string>, cb?: () => void) => void,
  all: (queryText: string, args?: Array<string>, cb?: () => void) => void
};

/**
 * Contains data about a column/property/key in a table
 */
type tableKeyType = {
  cid: number,
  name: string,
  type: string,
  notnull: 0 | 1,
  dflt_value: string,
  pk: 0 | 1
};

// @TODO: Why does logging in constructor vs logging in driver execute
// return two different things
class SqliteProvider extends BaseProvider implements ProviderInterface {
  connection: connectionType;

  sqliteErrors = {
    CANCELED: 'SQLITE_INTERRUPT'
  };

  constructor(server: Object, database: Object, connection: Object) {
    super(server, database);
    this.connection = connection;
  }

  // @NOT_SUPPORTED
  disconnect() {
    // SQLite does not have connection poll. So we open and close connections
    // for every query request. This allows multiple request at same time by
    // using a different thread for each connection.
    // This may cause connection limit problem. So we may have to change this at some point.
  }

  wrapIdentifier(value: string): string {
    if (value === '*') {
      return value;
    }

    const matched = value.match(/(.*?)(\[[0-9]\])/); // eslint-disable-line no-useless-escape

    return matched
      ? this.wrapIdentifier(matched[1]) + matched[2]
      : `"${value.replace(/"/g, '""')}"`;
  }

  getQuerySelectTop(table: string, limit: number) {
    return Promise.resolve(
      `SELECT * FROM ${this.wrapIdentifier(table)} LIMIT ${limit}`
    );
  }

  query(queryText: string): Promise<queryType> {
    let queryConnection = null;
    const self = this;

    return Promise.resolve({
      execute() {
        return self.runWithConnection(() => {
          try {
            queryConnection = self.connection;
            return self.executeQuery(queryText);
          } catch (err) {
            if (err.code === self.CANCELED) {
              err.sqlectronError = 'CANCELED_BY_USER';
            }
            throw err;
          }
        });
      },
      cancel() {
        if (!queryConnection) {
          throw new Error('Query not ready to be canceled');
        }
        queryConnection.interrupt();
      }
    });
  }

  async executeQuery(queryText: string) {
    const result = await this.driverExecuteQuery({
      query: queryText,
      multiple: true
    });
    return result.map(this.parseRowQueryResult);
  }

  getConnectionType() {
    return Promise.resolve('local');
  }

  /**
   * Inserts a record into a table. If values is an empty object, will insert
   * an empty row
   */
  async insert(
    table: string,
    rows: Array<{ [string]: any }>
  ): Promise<{ timing: number }> {
    const tableKeys = await this.getTableColumnNames(table);
    const rowSqls = rows.map(row => {
      const rowData = tableKeys.map(
        key => (row[key] ? `'${row[key]}'` : 'NULL')
      );
      return `(${rowData.join(', ')})`;
    });
    const query = `
     INSERT INTO ${table} (${tableKeys.join(', ')})
     VALUES
     ${rowSqls.join(',\n')};
    `;
    const foo = this.driverExecuteQuery({ query }).then(res => res.data);
    return foo;
  }

  /**
   * Each item in records will update new values in changes
   * @param changes - Object contaning column:newValue pairs
   * @param rowPrimaryKey - The row's (record's) identifier
   */
  async update(
    table: string,
    records: Array<{
      rowPrimaryKeyValue: string,
      changes: { [string]: any }
    }>
  ): Promise<{ timing: number }> {
    const tablePrimaryKey = await this.getPrimaryKey(table);
    const queries = records.map(record => {
      const columnNames = Object.keys(record.changes);
      const edits = columnNames.map(
        columnName => `${columnName} = '${record.changes[columnName]}'`
      );
      return `
        UPDATE ${table}
        SET ${edits.join(', ')}
        WHERE ${tablePrimaryKey.name} = ${record.rowPrimaryKeyValue};
    `;
    });
    const finalQuery = queries.join('\n');
    return this.driverExecuteQuery({ query: finalQuery }).then(res => res.data);
  }

  /**
   * Deletes records from a table. Finds table's primary key then deletes
   * specified keys
   */
  async delete(
    table: string,
    keys: Array<string> | Array<number>
  ): Promise<{ timing: number }> {
    const primaryKey = await this.getPrimaryKey(table);
    const conditions = keys.map(key => `${primaryKey.name} = "${key}"`);
    const query = `
      DELETE FROM ${table}
      WHERE ${conditions.join(' OR ')}
    `;
    const results = await this.driverExecuteQuery({ query }).then(
      res => res.data
    );
    return results;
  }

  getVersion() {
    return this.driverExecuteQuery({ query: 'SELECT sqlite_version()' }).then(
      res => res.data[0]['sqlite_version()']
    );
  }

  /**
   * Gets data about columns (properties) in a table
   */
  async getTableKeys(
    table: string,
    raw: bool = false
  ): Promise<Array<tableKeyType>> {
    const sql = `PRAGMA table_info(${table})`;
    const rawResults = this.driverExecuteQuery({ query: sql }).then(
      res => res.data
    );
    return raw ? rawResults : rawResults.then(res => res);
  }

  async getPrimaryKey(table: string): Promise<tableKeyType> {
    const keys = await this.getTableKeys(table);
    const primaryKey = keys.find(key => key.pk === 1);
    if (!primaryKey) {
      throw new Error(`No primary key exists in table ${table}`);
    }
    return primaryKey;
  }

  async getTableValues(table: string) {
    const sql = `
      SELECT *
      FROM '${table}';
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  async getTableNames() {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type='table'
    `;
    return this.driverExecuteQuery({ query: sql }).then(res =>
      res.data.map(table => table.name)
    );
  }

  async listTables() {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  async listViews() {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'view'
    `;
    return this.driverExecuteQuery({ query: sql }).then(res => res.data);
  }

  // @NOT_SUPPORTED
  listRoutines() {
    return Promise.resolve([]);
  }

  async getTableColumnNames(table: string) {
    this.checkIsConnected();
    const columns = await this.listTableColumns(table);
    return columns.map(column => column.columnName);
  }

  async listTableColumns(table: string) {
    const sql = `PRAGMA table_info(${table})`;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => ({
      columnName: row.name,
      dataType: row.type
    }));
  }

  async listTableTriggers(table: string) {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'trigger'
        AND tbl_name = '${table}'
    `;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.name);
  }

  async listTableIndexes(table: string) {
    const sql = `PRAGMA INDEX_LIST('${table}')`;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.name);
  }

  // @NOT_SUPPORTED
  listSchemas() {
    return Promise.resolve([]);
  }

  async listDatabases() {
    const result = await this.driverExecuteQuery({
      query: 'PRAGMA database_list;'
    });

    if (!result) {
      throw new Error('No results');
    }

    return result.data.map(row => row.file || ':memory:');
  }

  // @TODO
  getTableReferences() {
    return Promise.resolve([]);
  }

  async getTableCreateScript(table: string) {
    const sql = `
      SELECT sql
      FROM sqlite_master
      WHERE name = '${table}';
    `;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.sql);
  }

  async getViewCreateScript(view) {
    const sql = `
      SELECT sql
      FROM sqlite_master
      WHERE name = '${view}';
    `;
    const { data } = await this.driverExecuteQuery({ query: sql });

    return data.map(row => row.sql);
  }

  // @NOT_SUPPORTED
  getRoutineCreateScript() {
    return Promise.resolve('');
  }

  /**
   * SQLITE is a local file in there's no concept of being 'online'. Or
   * are we online when we can verify that the path to the sqlite database
   * exists?
   */
  isOnline() {
    return Promise.resolve(true);
  }

  async truncateAllTables() {
    return this.runWithConnection(async () => {
      const tables: Array<{ name: string }> = await this.listTables();

      const truncateAllQuery = tables
        .map(
          table => `
          DELETE FROM ${table.name};
        `
        )
        .join('');

      // @TODO: Check if sqlite_sequence exists then execute:
      //        DELETE FROM sqlite_sequence WHERE name='${table}';

      return this.driverExecuteQuery({ query: truncateAllQuery });
    });
  }

  parseRowQueryResult({ data, statement, changes }): queryResponseType {
    // Fallback in case the identifier could not reconize the command
    const isSelect = Array.isArray(data);
    const rows = data || [];

    return {
      rows,
      command: statement.type || (isSelect && 'SELECT'),
      fields: Object.keys(rows[0] || {}).map(name => ({ name })),
      rowCount: data && data.length,
      affectedRows: changes || 0
    };
  }

  identifyCommands(queryText) {
    try {
      return identify(queryText, { strict: false });
    } catch (err) {
      return [];
    }
  }

  /**
   * Various methods use driverExecutQuery to execute sql statements.
   * 1. driverExecuteQuery creates identifyStatementsRunQuery() which uses
   * runQuery()
   * 2. driverExecuteQuery calls runWithConnection(identifyStatementsRunQuery)
   * 3. runWithConnection creates a node-sqlite3 db which is identifyStatementsRunQuery
   * to executes the sql statement and runQuery is given to node-sqlite3 to
   * return the results of the query
   * @private
   */
  async driverExecuteQuery(queryArgs: queryArgsType): Promise<Object> {
    const runQuery = (connection: connectionType, { executionType, text }) =>
      new Promise((resolve, reject) => {
        const method = this.resolveExecutionType(executionType);
        // Callback used by node-sqlite3 to return results of query
        const fn = function queryCallback(err?: Error, data?: Object) {
          if (err) {
            return reject(err);
          }
          return resolve({
            data,
            lastID: this.lastID,
            changes: this.changes
          });
        };

        switch (method) {
          case 'run': {
            return connection.run(text, queryArgs.params || [], fn);
          }
          case 'all': {
            return connection.all(text, queryArgs.params || [], fn);
          }
          default: {
            throw new Error(`Unknown connection method "${method}"`);
          }
        }
      });

    const identifyStatementsRunQuery = async (connection: connectionType) => {
      const statements = this.identifyCommands(queryArgs.query);

      const results = statements.map(statement =>
        runQuery(connection, statement).then(result => ({
          ...result,
          statement
        }))
      );

      return queryArgs.multiple
        ? Promise.all(results)
        : Promise.resolve(results[0]);
    };

    return this.connection.connection
      ? await identifyStatementsRunQuery(this.connection.connection)
      : this.runWithConnection(identifyStatementsRunQuery);
  }

  runWithConnection(run: () => Promise<Array<Object>>) {
    return new Promise((resolve, reject) => {
      sqlite3.verbose();

      const db = new sqlite3.Database(
        this.connection.dbConfig.database,
        async err => {
          if (err) {
            return reject(err);
          }

          db.on('profile', (sql, ms) => {
            console.log(sql);
            console.log(ms);
          });

          try {
            db.serialize();
            return resolve(run(db));
          } catch (runErr) {
            reject(runErr);
          } finally {
            db.close();
          }

          return db;
        }
      );
    });
  }

  /**
   * @private
   */
  resolveExecutionType(executionType: string): 'run' | 'all' {
    switch (executionType) {
      case 'MODIFICATION':
        return 'run';
      default:
        return 'all';
    }
  }

  /**
   * @private
   */
  checkUnsupported(exportOptions: exportOptionsType) {
    const unsupportedOptions = ['views', 'procedures', 'functions', 'rows'];
    const hasUnsupported = Object.keys(exportOptions).some(option =>
      unsupportedOptions.includes(option)
    );

    if (hasUnsupported) {
      throw new Error(
        `Unsupported properties passed: ${JSON.stringify(exportOptions)}`
      );
    }
  }
}

function configDatabase(server, database) {
  return {
    database: database.database
  };
}

async function SqliteFactory(
  server: serverType,
  database: databaseType
): FactoryType {
  const logger = createLogger('db:clients:sqlite');
  const dbConfig = configDatabase(server, database);
  const connection = { dbConfig };
  logger().debug('create driver client for sqlite3 with config %j', dbConfig);

  const provider = new SqliteProvider(server, database, connection);

  // Light solution to test connection with with the server
  await provider.driverExecuteQuery({ query: 'SELECT sqlite_version()' });

  return provider;
}

export default SqliteFactory;
