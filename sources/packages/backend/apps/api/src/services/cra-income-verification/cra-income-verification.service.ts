import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RecordDataModelService, CRAIncomeVerification } from "@sims/sims-db";

/**
 * Service layer for CRA income verifications.
 */
@Injectable()
export class CRAIncomeVerificationService extends RecordDataModelService<CRAIncomeVerification> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(CRAIncomeVerification));
  }

  /**
   * Get the student and supporting users (if any) income verification details for an applications.
   * @param applicationId application id.
   * @returns income verification details for an applications.
   */
  async getAllIncomeVerificationsForAnApplication(
    applicationId: number,
  ): Promise<CRAIncomeVerification[]> {
    return this.repo.find({
      select: {
        id: true,
        supportingUser: {
          id: true,
          supportingUserType: true,
        },
        dateReceived: true,
      },
      relations: {
        supportingUser: true,
      },
      where: {
        application: {
          id: applicationId,
        },
      },
    });
  }
}
