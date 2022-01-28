import { QueryRunner, Repository } from "typeorm";

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
 * This helper to to get the total count of the Raw for the pagination.
 * For example, if there is a scenario to use typeorm `getRawMany`, typeorm
 * doesn't have a utility to get the count of the raw entities (getManyAndCount
 * will return count without innerJoins), Fpr those cases we can use this helper
 * function to get the actual count of the raw data
 * @param sqlQuery the sql query (result of typeorm .getSql()).
 * if we want the total count, then pass the sql query without the
 * pagination logic (i.e, without .skip(), .take(), .limit() or .offset())
 * @param parameter pass the parameter of the sql query.
 * @return the total count
 */
export async function getRawCount(
  repo: Repository<any>,
  sqlQuery: string,
  parameter: any[],
): Promise<[{ count: number }]> {
  return repo.query(`SELECT COUNT(*) FROM (${sqlQuery}) AS count`, parameter);
}
