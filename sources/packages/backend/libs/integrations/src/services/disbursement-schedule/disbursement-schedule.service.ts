import { Injectable } from "@nestjs/common";
import { DisbursementValueMap } from "./disbursement-schedule.models";
import { ConfirmationOfEnrollmentService } from "@sims/services";
import {
  RecordDataModelService,
  DisbursementSchedule,
  OfferingIntensity,
} from "@sims/sims-db";
import { DataSource } from "typeorm";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    readonly dataSource: DataSource,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
  }

  /**
   * Get the disbursement schedule by its document number.
   * @param documentNumber document number.
   * @returns disbursement schedule respective to the provided document number.
   */
  async getDisbursementScheduleByDocumentNumber(
    documentNumber: number,
  ): Promise<DisbursementSchedule> {
    return this.repo.findOne({
      select: {
        id: true,
        documentNumber: true,
        studentAssessment: {
          id: true,
          application: {
            id: true,
            applicationNumber: true,
            student: {
              id: true,
              user: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      relations: {
        studentAssessment: { application: { student: { user: true } } },
      },
      where: { documentNumber },
    });
  }

  /**
   * Get disbursement schedules by document numbers.
   * @param documentNumbers document numbers of disbursements.
   * @returns disbursement schedules.
   */
  async getDisbursementsByDocumentNumbers(
    documentNumbers: number[],
  ): Promise<DisbursementSchedule[]> {
    return this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.documentNumber",
      ])
      .where("disbursementSchedule.documentNumber IN (:...documentNumbers)", {
        documentNumbers,
      })
      .getMany();
  }

  /**
   * Fetch the COEs which are eligible to confirm enrolment by the institutions.
   * @returns eligible COE.
   */
  async getInstitutionEligiblePendingEnrolments(): Promise<
    DisbursementSchedule[]
  > {
    const eligibleCOEQuery =
      this.confirmationOfEnrollmentService.getDisbursementForCOEQuery(
        this.repo,
        {
          loadWorkflowData: true,
        },
      );
    return eligibleCOEQuery
      .andWhere("offering.offeringIntensity = :fullTime", {
        fullTime: OfferingIntensity.fullTime,
      })
      .andWhere("location.hasIntegration = true")
      .orderBy("disbursementSchedule.id", "ASC")
      .getMany();
  }

  /**
   * Generates a map associating disbursement value IDs to their
   * respective disbursement schedule IDs.
   * @param disbursementValueIds array of disbursement value IDs.
   * @returns a map of disbursement value IDs to their respective
   * disbursement schedule IDs.
   */
  async getDisbursementScheduleValuesMap(
    disbursementValueIds: number[],
  ): Promise<DisbursementValueMap> {
    const disbursementValues = await this.repo
      .createQueryBuilder("disbursementSchedule")
      .distinct()
      .select("disbursementSchedule.id", "disbursementScheduleId")
      .addSelect("disbursementValue.id", "disbursementValueId")
      .innerJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .where("disbursementValue.id IN (:...disbursementValueIds)", {
        disbursementValueIds,
      })
      .getRawMany<{
        disbursementScheduleId: number;
        disbursementValueId: number;
      }>();
    const result: DisbursementValueMap = {};
    for (const value of disbursementValues) {
      result[value.disbursementValueId] = value.disbursementScheduleId;
    }
    return result;
  }
}
