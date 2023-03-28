import { User } from "@sims/sims-db";
import { DataSource } from "typeorm";
import { AESTGroups } from "./aest-token-helpers";

/**
 * Get the ministry user associated with the ministry user token type.
 * This data is currently created on DB by the test-db-seeding prior to E2E tests execution.
 * @param dataSource allow access to the database.
 * @param userType type of the ministry user.
 * @returns ministry user associated with the ministry user token type.
 */
export async function getAESTUser(
  dataSource: DataSource,
  userType: AESTGroups,
): Promise<User> {
  let userName: string;
  switch (userType) {
    case AESTGroups.BusinessAdministrators:
      userName = process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER;
      break;
    case AESTGroups.MOFOperations:
      userName = process.env.E2E_TEST_AEST_MOF_OPERATIONS_USER;
      break;
    case AESTGroups.Operations:
      userName = process.env.E2E_TEST_AEST_OPERATIONS_USER;
      break;
    case AESTGroups.OperationsAdministrators:
      userName = process.env.E2E_TEST_AEST_OPERATIONS_ADMINISTRATORS_USER;
      break;
  }
  const userRepo = dataSource.getRepository(User);
  return userRepo.findOneBy({ userName });
}
