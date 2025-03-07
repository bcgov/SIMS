import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  DisbursementSchedule,
  ApplicationStatus,
  COEStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import { addDays, COE_WINDOW } from "@sims/utilities";
import { DataSource } from "typeorm";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(readonly dataSource: DataSource) {
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
   * @returns eligible COE .
   */
  async getInstitutionEligiblePendingEnrolments(): Promise<
    DisbursementSchedule[]
  > {
    const coeThresholdDate = addDays(COE_WINDOW);
    return this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementValues.id",
        "disbursementValues.valueAmount",
        "disbursementValues.valueCode",
        "studentAssessment.id",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "location.id",
        "location.institutionCode",
        "application.id",
        "application.applicationNumber",
        "application.studentNumber",
        "student.id",
        "student.birthDate",
        "sinValidation.id",
        "sinValidation.sin",
        "user.id",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin(
        "disbursementSchedule.disbursementValues",
        "disbursementValues",
      )
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("application.student", "student")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("student.user", "user")
      .where("studentAssessment.id = application.currentAssessment.id")
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.Enrolment, ApplicationStatus.Completed],
      })
      .andWhere("disbursementSchedule.hasEstimatedAwards = true")
      .andWhere("disbursementSchedule.disbursementDate <= :coeThresholdDate", {
        coeThresholdDate,
      })
      .andWhere("disbursementSchedule.coeStatus = :required", {
        required: COEStatus.required,
      })
      .andWhere("offering.offeringIntensity = :fullTime", {
        fullTime: OfferingIntensity.fullTime,
      })
      .andWhere("location.hasIntegration = TRUE")
      .getMany();
  }
}
