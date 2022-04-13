import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { StudentScholasticStanding } from "../../database/entities/student-scholastic-standing.model";
import { ScholasticStandingStatus } from "../../database/entities";

/**
 * Manages the student scholastic standings related operations.
 */
@Injectable()
export class StudentScholasticStandingsService extends RecordDataModelService<StudentScholasticStanding> {
  constructor(connection: Connection) {
    super(connection.getRepository(StudentScholasticStanding));
  }

  /**
   * Get all pending and declined scholastic standings
   * for an application.
   * @param applicationId application id.
   * @returns StudentScholasticStanding list.
   */
  getPendingAndDeniedScholasticStanding(
    applicationId: number,
  ): Promise<StudentScholasticStanding[]> {
    return this.repo
      .createQueryBuilder("scholasticStanding")
      .select([
        "scholasticStanding.id",
        "scholasticStanding.scholasticStandingStatus",
        "scholasticStanding.submittedDate",
      ])
      .innerJoin("scholasticStanding.application", "application")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("scholasticStanding.scholasticStandingStatus != :status", {
        status: ScholasticStandingStatus.Approved,
      })
      .getMany();
  }
}
