
# Database Migration

## Path symbols

- $SRC_ROOT = `/sources`
- $API_ROOT = `/sources/packages/api`

## Process

- Run all make command in `$SRC_ROOT`

- Checkout code locally cd to `$API_ROOT`

- To create new migration runner file. Run the command

   ```bash
   npx typeorm migration:create -n "<Migration File Name>"
   ```

- The above command will generate a migration file containing method stubs for async up and async down methods under the following package
   `sources/packages/api/src/database/migrations`

- Add the sql that is intended to be run using
   `queryRunner.query()` method inside up method.
   See e.g. in `SIMS\sources\packages\api\src\database\migrations\1614107103138-StudentPDVerified.ts\1614107103138-StudentPDVerified.ts`

- Add the sql that is intended to be run using
   queryRunner.query() method inside down method. This will be run when database is going to be rolled back and/or database cleanup.
   See e.g. in `SIMS\sources\packages\api\src\database\migrations\1614107103138-StudentPDVerified.ts\1614107103138-StudentPDVerified.ts`

- Run migration: The following `npm` command will run migration scripts, but make sure db exists in environment, if you are not executing in docker container, please add `NODE_ENV=local`. Run this command inside `$API_ROOT`

  ```bash
  npm run setup:db
  ```

  or

  ```bash
  NODE_ENV=local npm run setup:db
  ```

- The migration process is build into api container entry command, so executing api container will automatically run migration

   ```bash
   make local
   ```

   or

   ```bash
   make local-api
   ```

- Cleaning existing database

  ```bash
  make local-clean
  ```

- Normally we write our database setup or modification as raw sql file stored in `$API_ROOT/src-sql`. The convention is add your file in `$API_ROOT/src-sql/FEATURE_OR_OPS_NAME/*.sql` Then we inject this sql file into migration script using `getSQLFileData()` utility method.

example:

  ```ts
  export class User1610712571660 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(getSQLFileData("Create-User.sql", "User"));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(getSQLFileData("Drop-User.sql", "User"));
    }
  }
  ```
