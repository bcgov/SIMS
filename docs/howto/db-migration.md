# Database Migration

1. Checkout code locally cd to `sources/packages/api`

2. Run the command
   ```bash
   $ npx typeorm migration:create -n "addStudentPDColumn"
   ```
3. The above command will generate a migration file containing method stubs for async up and async down methods under the following package
   `sources/packages/api/src/database/migrations`

4. Add the sql that is intended to be run using
   `queryRunner.query()` method inside up method.
   See e.g. in `SIMS\sources\packages\api\src\database\migrations\1614107103138-StudentPDVerified.ts\1614107103138-StudentPDVerified.ts`

5. If applicable Add the sql that is intended to be run using
   queryRunner.query() method inside down method. This will be run when database is being wiped out.
   See e.g. in `SIMS\sources\packages\api\src\database\migrations\1614107103138-StudentPDVerified.ts\1614107103138-StudentPDVerified.ts`

6. Run the command to clean out all the volumes(database)

   ```bash
   $ make local-clean
   ```

7. Verify the migration
