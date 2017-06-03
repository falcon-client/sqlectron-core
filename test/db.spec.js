import { db } from '../src';
import config from './databases/config';
import setupSQLite from './databases/sqlite/setup';
import setupCassandra from './databases/cassandra/setup';


jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

/**
 * List of supported DB clients.
 * The "integration" tests will be executed for all supported DB clients.
 * And ensure all these clients has the same API and output results.
 */
const SUPPORTED_DB_CLIENTS = [
  'mysql',
  'postgresql',
  'sqlserver',
  'sqlite',
  'cassandra'
];

const dbSchemas = {
  postgresql: 'public',
  sqlserver: 'dbo'
};


/**
 * List of selected databases to be tested in the current task
 */
const dbsToTest = (process.env.DB_CLIENTS || '').split(',').filter((client) => !!client);


describe('db', () => {
  const dbClients = dbsToTest.length ? dbsToTest : SUPPORTED_DB_CLIENTS;
  if (dbClients.some((dbClient) => !~SUPPORTED_DB_CLIENTS.indexOf(dbClient))) {
    throw new Error('Invalid selected db client for tests');
  }

  if (~dbClients.indexOf('sqlite')) {
    setupSQLite(config.sqlite);
  } else if (~dbClients.indexOf('cassandra')) {
    setupCassandra(config.cassandra);
  }

  dbClients.forEach((dbClient) => {
    const dbSchema = dbSchemas[dbClient];

    describe(dbClient, () => {
      describe('.connect', () => {
        it(`should connect into a ${dbClient} database`, async () => {
          const serverInfo = {
            ...config[dbClient],
            name: dbClient,
            client: dbClient
          };

          const serverSession = await db.createServer(serverInfo);
          const dbConn = await serverSession.createConnection(serverInfo.database);

          await dbConn.connect();
        });

        it('should connect into server without database specified', async () => {
          const serverInfo = {
            ...config[dbClient],
            database: db.CLIENTS.find((c) => c.key === dbClient).defaultDatabase,
            name: dbClient,
            client: dbClient
          };

          const serverSession = await db.createServer(serverInfo);
          const dbConn = await serverSession.createConnection(serverInfo.database);

          await dbConn.connect();
        });
      });

      describe('given is already connected', () => {
        const serverInfo = {
          ...config[dbClient],
          name: dbClient,
          client: dbClient
        };

        let serverSession;
        let dbConn;
        beforeEach(async () => {
          serverSession = await db.createServer(serverInfo);
          dbConn = await serverSession.createConnection(serverInfo.database);
          return dbConn.connect();
        });

        describe('.disconnect', () => {
          it('should close all connections in the pool', () => {
            dbConn.disconnect();
          });
        });

        describe('.listDatabases', () => {
          it('should list all databases', async () => {
            const databases = await dbConn.listDatabases();
            expect(databases).toMatchSnapshot();
          });
        });

        describe('.listTables', () => {
          it('should list all tables', async () => {
            const tables = await dbConn.listTables({ schema: dbSchema });
            expect(tables).toMatchSnapshot();
          });
        });

        if (dbClient !== 'cassandra') {
          describe('.listViews', () => {
            it('should list all views', async () => {
              const views = await dbConn.listViews({ schema: dbSchema });
              expect(views).toMatchSnapshot();
            });
          });
        }

        describe('.listRoutines', () => {
          it('should list all routines with their type', async () => {
            const routines = await dbConn.listRoutines({ schema: dbSchema });
            expect(routines).toMatchSnapshot();
          });
        });

        describe('.listTableColumns', () => {
          it('should list all columns and their type from users table', async () => {
            const columns = await dbConn.listTableColumns('users');
            expect(columns).toHaveLength(6);
            const column = (name) => columns.find((col) => col.columnName === name);
            expect(columns).toMatchSnapshot();
            expect(column('id')).toMatchSnapshot();
            expect(column('username')).toMatchSnapshot();
            expect(column('email')).toMatchSnapshot();
            expect(column('password')).toMatchSnapshot();
            expect(column('role_id')).toMatchSnapshot();
            expect(column('createdat')).toMatchSnapshot();
          });
        });

        describe('.listTableTriggers', () => {
          it('should list all table related triggers', async () => {
            const triggers = await dbConn.listTableTriggers('users');
            expect(triggers).toMatchSnapshot();
          });
        });

        describe('.listTableIndexes', () => {
          it('should list all indexes', async () => {
            const indexes = await dbConn.listTableIndexes('users', dbSchema);
            expect(indexes).toMatchSnapshot();
          });
        });

        describe('.listSchemas', () => {
          it('should list all schema', async () => {
            const schemas = await dbConn.listSchemas({ schema: { only: [dbSchema, 'dummy_schema'] } });
            expect(schemas).toMatchSnapshot();
          });
        });

        describe('.getTableReferences', () => {
          it('should list all tables that selected table has references to', async () => {
            const references = await dbConn.getTableReferences('users');
            expect(references).toMatchSnapshot();
          });
        });

        describe('.getTableKeys', () => {
          it('should list all tables keys', async () => {
            const tableKeys = await dbConn.getTableKeys('users');
            expect(tableKeys).toMatchSnapshot();
          });
        });

        /**
         * @TODO
         */
        describe.skip('.getTableValues', () => {
          it('should list all tables keys', async () => {
            const tableKeys = await dbConn.getTableValues('users');
            tableKeys.forEach((key) => {
              if (key.keyType === 'PRIMARY KEY') {
                expect(key).toMatchSnapshot();
                expect(key).toBeNull();
              } else {
                expect(key).toMatchSnapshot();
                expect(key).toMatchSnapshot();
                expect(key).toMatchSnapshot();
              }
            });
          });
        });

        describe('.getTableCreateScript', () => {
          it('should return table create script', async () => {
            const [createScript] = await dbConn.getTableCreateScript('users');
            expect(createScript).toMatchSnapshot();
          });
        });

        describe('.getTableSelectScript', () => {
          it('should return SELECT table script', async () => {
            const selectQuery = await dbConn.getTableSelectScript('users');
            expect(selectQuery).toMatchSnapshot();
          });

          it('should return SELECT table script with schema if defined', async () => {
            const selectQuery = await dbConn.getTableSelectScript('users', 'public');
            expect(selectQuery).toMatchSnapshot();
          });
        });


        describe('.getTableInsertScript', () => {
          it('should return INSERT INTO table script', async () => {
            const insertQuery = await dbConn.getTableInsertScript('users');
            expect(insertQuery).toMatchSnapshot();
          });

          it('should return INSERT INTO table script with schema if defined', async () => {
            const insertQuery = await dbConn.getTableInsertScript('users', 'public');
            expect(insertQuery).toMatchSnapshot();
          });
        });

        describe('.getTableUpdateScript', () => {
          it('should return UPDATE table script', async () => {
            const updateQuery = await dbConn.getTableUpdateScript('users');
            expect(updateQuery).toMatchSnapshot();
          });

          it('should return UPDATE table script with schema if defined', async () => {
            const updateQuery = await dbConn.getTableUpdateScript('users', 'public');
            expect(updateQuery).toMatchSnapshot();
          });
        });

        describe('.getTableDeleteScript', () => {
          it('should return table DELETE script', async () => {
            const deleteQuery = await dbConn.getTableDeleteScript('roles');
            expect(deleteQuery).toMatchSnapshot();
          });

          it('should return table DELETE script with schema if defined', async () => {
            const deleteQuery = await dbConn.getTableDeleteScript('roles', 'public');
            expect(deleteQuery).toMatchSnapshot();
          });
        });

        describe('.getViewCreateScript', () => {
          it('should return CREATE VIEW script', async () => {
            const [createScript] = await dbConn.getViewCreateScript('email_view');
            expect(createScript).toMatchSnapshot();
          });
        });

        describe('.getRoutineCreateScript', () => {
          it('should return CREATE PROCEDURE/FUNCTION script', async () => {
            const [createScript] = await dbConn.getRoutineCreateScript('users_count', 'Procedure');
            expect(createScript).toMatchSnapshot();
          });
        });

        if (dbClient !== 'cassandra') {
          describe('.query', () => { // eslint-disable-line func-names
            // this.timeout(15000);

            it('should be able to cancel the current query', async () => {
              const sleepCommands = {
                postgresql: 'SELECT pg_sleep(10);',
                mysql: 'SELECT SLEEP(10000);',
                sqlserver: 'WAITFOR DELAY \'00:00:10\'; SELECT 1 AS number',
                sqlite: ''
              };

              // Since sqlite does not has a query command to sleep
              // we have to do this by selecting a huge data source.
              // This trick maske select from the same table multiple times.
              if (dbClient === 'sqlite') {
                const fromTables = [];
                for (let i = 0; i < 50; i++) { // eslint-disable-line no-plusplus
                  fromTables.push('sqlite_master');
                }
                sleepCommands.sqlite = `SELECT last.name FROM ${fromTables.join(',')} as last`;
              }

              const query = await dbConn.query(sleepCommands[dbClient]);
              const executing = query.execute();

              // wait a 5 secs before cancel
              setTimeout(async () => {
                let error;
                try {
                  await Promise.all([
                    executing,
                    query.cancel()
                  ]);
                } catch (err) {
                  error = err;
                }
                expect(error.sqlectronError).toMatchSnapshot();
              }, 5000);
            });
          });
        }

        describe('.executeQuery', () => {
          const includePk = dbClient === 'cassandra';

          beforeEach(async () => {
            await dbConn.executeQuery(`
              INSERT INTO roles (${includePk ? 'id,' : ''} name)
              VALUES (${includePk ? '1,' : ''} 'developer')
            `);

            await dbConn.executeQuery(`
              INSERT INTO users (${includePk ? 'id,' : ''} username, email, password, role_id, createdat)
              VALUES (${includePk ? '1,' : ''} 'maxcnunes', 'maxcnunes@gmail.com', '123456', 1,'2016-10-25')
            `);
          });

          afterEach(() => dbConn.truncateAllTables());

          describe('SELECT', () => {
            it('should execute an empty query', async () => {
              try {
                const results = await dbConn.executeQuery('');
                expect(results).toMatchSnapshot();
              } catch (err) {
                if (dbClient === 'cassandra') {
                  expect(err.message).toMatchSnapshot();
                } else {
                  throw err;
                }
              }
            });

            it('should execute an query with only comments', async () => {
              try {
                const results = await dbConn.executeQuery('-- my comment');
                expect(results).toMatchSnapshot();
              } catch (err) {
                if (dbClient === 'cassandra') {
                  expect(err.message).toMatchSnapshot();
                } else {
                  throw err;
                }
              }
            });

            it('should execute a single query with empty result', async () => {
              const results = await dbConn.executeQuery('select * from users where id = 0');
              expect(results).toMatchSnapshot();
            });

            it('should execute a single query', async () => {
              const results = await dbConn.executeQuery('select * from users');
              expect(results).toMatchSnapshot();
              const [result] = results;
              const field = (name) => result.fields.find((item) => item.name === name);

              expect(field('id')).toMatchSnapshot();
              expect(field('username')).toMatchSnapshot();
              expect(field('email')).toMatchSnapshot();
              expect(field('password')).toMatchSnapshot();
              expect(field('role_id')).toMatchSnapshot();
              expect(field('createdat')).toMatchSnapshot();
            });

            if (dbClient === 'mysql' || dbClient === 'postgresql') {
              it('should not cast DATE types to native JS Date objects', async () => {
                const results = await dbConn.executeQuery('select createdat from users');
                expect(results).toMatchSnapshot();
              });
            }

            it('should execute multiple queries', async () => {
              try {
                const results = await dbConn.executeQuery(`
                  select * from users;
                  select * from roles;
                `);
                expect(results).toMatchSnapshot();
              } catch (err) {
                if (dbClient === 'cassandra') {
                  expect(err.message).toMatch(/missing EOF at 'select'/);
                } else {
                  throw err;
                }
              }
            });
          });

          describe('INSERT', () => {
            it('should execute a single query', async () => {
              const results = await dbConn.executeQuery(`
                insert into users (${includePk ? 'id,' : ''} username, email, password)
                values (${includePk ? '1,' : ''} 'user', 'user@hotmail.com', '123456')
              `);

              expect(results).toMatchSnapshot();
            });

            it('should execute multiple queries', async () => {
              try {
                const results = await dbConn.executeQuery(`
                  insert into users (username, email, password)
                  values ('user', 'user@hotmail.com', '123456');

                  insert into roles (name)
                  values ('manager');
                `);
                expect(results).toMatchSnapshot();
              } catch (err) {
                if (dbClient === 'cassandra') {
                  expect(err.message).toMatch(/missing EOF at 'insert'/);
                } else {
                  throw err;
                }
              }
            });
          });

          describe('DELETE', () => {
            it('should execute a single query', async () => {
              const results = await dbConn.executeQuery(`
                delete from users where id = 1
              `);
              expect(results).toMatchSnapshot();
            });

            it('should execute multiple queries', async () => {
              try {
                const results = await dbConn.executeQuery(`
                  delete from users where username = 'maxcnunes';
                  delete from roles where name = 'developer';
                `);
                expect(results).toMatchSnapshot();
              } catch (err) {
                if (dbClient === 'cassandra') {
                  expect(err.message).toMatch(/missing EOF at 'delete'/);
                } else {
                  throw err;
                }
              }
            });
          });

          describe('UPDATE', () => {
            it('should execute a single query', async () => {
              const results = await dbConn.executeQuery(`
                update users set username = 'max' where id = 1
              `);
              expect(results).toMatchSnapshot();
            });

            it('should execute multiple queries', async () => {
              try {
                const results = await dbConn.executeQuery(`
                  update users set username = 'max' where username = 'maxcnunes';
                  update roles set name = 'dev' where name = 'developer';
                `);

                // MSSQL treats multiple non select queries as a single query result
                expect(results).toMatchSnapshot();
              } catch (err) {
                if (dbClient === 'cassandra') {
                  expect(err.message).toMatch(/missing EOF at 'update'/);
                } else {
                  throw err;
                }
              }
            });
          });

          if (dbClient !== 'cassandra' && dbClient !== 'sqlite') {
            describe('CREATE', () => {
              describe('DATABASE', () => {
                beforeEach(async () => {
                  try {
                    await dbConn.executeQuery('drop database db_test_create_database');
                  } catch (err) {
                    // just ignore
                  }
                });

                it('should execute a single query', async () => {
                  const results = await dbConn.executeQuery('create database db_test_create_database');
                  expect(results).toMatchSnapshot();
                });
              });
            });
          }

          if (dbClient !== 'cassandra' && dbClient !== 'sqlite') {
            describe('DROP', () => {
              describe('DATABASE', () => {
                beforeEach(async () => {
                  try {
                    await dbConn.executeQuery('create database db_test_create_database');
                  } catch (err) {
                    // just ignore
                  }
                });

                it('should execute a single query', async () => {
                  const results = await dbConn.executeQuery('drop database db_test_create_database');
                  expect(results).toHaveLength(1);
                  expect(results).toMatchSnapshot();
                });
              });
            });
          }

          if (dbClient === 'postgresql') {
            describe('EXPLAIN', () => {
              it('should execute a single query', async () => {
                const results = await dbConn.executeQuery('explain select * from users');
                expect(results).toHaveLength(1);
                expect(results).toMatchSnapshot();
              });
            });
          }
        });
      });
    });
  });
});
