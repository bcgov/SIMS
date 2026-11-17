import { ProgramStatus } from "@sims/sims-db";
import { SortPriority } from "../../utilities";

/**
 * Gets the SQL expression to sort education programs by their status, using
 * the following priority: pending, approved, declined, and inactive.
 * Inactive or expired programs are sorted as inactive, independently of their
 * program status.
 * @param alias education program alias used in the query.
 * @returns SQL expression to be used to sort the education programs by status.
 */
export function getProgramStatusSortExpression(alias: string): string {
  const activeCondition = `${alias}.isActive = true and (${alias}.effectiveEndDate is null OR ${alias}.effectiveEndDate > CURRENT_DATE)`;
  return `CASE
    WHEN ${alias}.programStatus = '${ProgramStatus.Pending}' and ${activeCondition} THEN ${SortPriority.Priority1}
    WHEN ${alias}.programStatus = '${ProgramStatus.Approved}' and ${activeCondition} THEN ${SortPriority.Priority2}
    WHEN ${alias}.programStatus = '${ProgramStatus.Declined}' and ${activeCondition} THEN ${SortPriority.Priority3}
    WHEN ${alias}.isActive = false or (${alias}.effectiveEndDate is not null and ${alias}.effectiveEndDate <= CURRENT_DATE) THEN ${SortPriority.Priority4}
    ELSE ${SortPriority.Priority5}
  END`;
}
