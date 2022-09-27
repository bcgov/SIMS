import { ObjectLiteral, QueryRunner, Repository } from "typeorm";

/**
 * Result type of a Typeorm query when the method getRawAndEntities is used.
 */
export interface RawAndEntities {
  entities: any[];
  raw: any[];
}

/**
 * Configures a session timeout specific for transactions that are idles
 * for more time than expected. It is going to take effect only in
 * Postgres Activities defined with the status 'idle in transaction'
 * (e.g. SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction').
 * It is useful to be defined before the execution of some transaction to handle
 * the worst-case scenario where the commit/rollback was not executed due to a
 * possible catastrophic failure.
 * @param queryRunner Typeorm query runner executing the operation.
 * @param seconds amount of seconds before the transaction is released in
 * case it is idle.
 */
export async function configureIdleTransactionSessionTimeout(
  queryRunner: QueryRunner,
  seconds: number,
): Promise<void> {
  queryRunner.query(`SET idle_in_transaction_session_timeout = '${seconds}s'`);
}

/**
 * This helper to get the total count of the Raw for the pagination.
 * For example, if there is a scenario to use typeORM `getRawMany`, typeORM
 * doesn't have a utility to get the count of the raw entities (getManyAndCount
 * will return count without innerJoins), For those cases we can use this helper
 * function to get the actual total count of the raw data
 * @param sqlQuery the sql query (result of typeORM .getSql()).
 * if we want the total count, then pass the sql query without the
 * pagination logic (i.e, without .skip(), .take(), .limit() or .offset())
 * @param parameter pass the parameter of the sql query.
 * @return the total count
 */
export async function getRawCount(
  repo: Repository<ObjectLiteral>,
  sqlQuery: string,
  parameter: any[],
): Promise<number> {
  const result = await repo.query(
    `SELECT COUNT(*) FROM (${sqlQuery}) AS count`,
    parameter,
  );
  return +result[0].count;
}

/**
 * Map additional properties retrieved during a SQL select operation
 * that does not belong to the database entity model itself.
 * Using the Typeorm method getRawAndEntities we can have access to
 * the entity model created and the raw SQL result that will contain
 * the additional properties.
 * @param rawAndEntities entity models retrieved and the raw data used
 * to create them.
 * @param propertyNames properties that need to be mapped from the raw
 * data into a property in a usually extended entity model.
 * @returns extended entity model with the additional properties mapped.
 */
export function mapFromRawAndEntities<TResult>(
  rawAndEntities: RawAndEntities,
  ...propertyNames: string[]
): TResult[] | null {
  if (!rawAndEntities.entities) {
    return null;
  }
  return rawAndEntities.entities.map((value, index: number) => {
    const resultObject = value as TResult;
    propertyNames.forEach((property: string) => {
      resultObject[property] = rawAndEntities.raw[index][property];
    });

    return resultObject;
  });
}
