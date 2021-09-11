import { QueryRunner } from "typeorm";

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
