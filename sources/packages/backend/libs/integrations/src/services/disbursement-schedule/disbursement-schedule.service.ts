import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  DisbursementSchedule,
  OfferingIntensity,
  ApplicationStatus,
  COEStatus,
} from "@sims/sims-db";
import { DataSource, In } from "typeorm";

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
   * Fetch the COEs which are pending for the institution.
   * @returns eligible COEs.
   */
  async getPendingCOEs(): Promise<DisbursementSchedule[]> {
    return this.repo.find({
      select: {
        id: true,
        disbursementDate: true,
        disbursementValues: { id: true, valueCode: true, valueAmount: true },
        studentAssessment: {
          id: true,
          application: {
            id: true,
            applicationNumber: true,
            studentNumber: true,
            currentAssessment: {
              id: true,
              offering: {
                id: true,
                studyStartDate: true,
                studyEndDate: true,
                institutionLocation: {
                  institutionCode: true,
                },
              },
            },
            student: {
              id: true,
              birthDate: true,
              sinValidation: { id: true, sin: true },
              user: { id: true, lastName: true, firstName: true },
            },
          },
        },
      },
      relations: {
        disbursementValues: true,
        studentAssessment: {
          application: {
            currentAssessment: { offering: { institutionLocation: true } },
            student: {
              sinValidation: true,
              user: true,
            },
          },
        },
      },
      where: {
        coeStatus: COEStatus.required,
        studentAssessment: {
          application: {
            applicationStatus: In([
              ApplicationStatus.Enrolment,
              ApplicationStatus.Completed,
            ]),
            currentAssessment: {
              offering: {
                institutionLocation: { hasIntegration: true },
                offeringIntensity: OfferingIntensity.fullTime,
              },
            },
          },
        },
        hasEstimatedAwards: true,
      },
    });
  }
}
