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
   * Get DisbursementSchedule by documentNumber
   * @param documentNumber document Number
   * @returns DisbursementSchedule respective to passed documentNumber.
   */
  async getDisbursementScheduleByDocumentNumber(
    documentNumber: number,
  ): Promise<DisbursementSchedule> {
    return this.repo.findOne({ where: { documentNumber } });
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
              ApplicationStatus.enrollment,
              ApplicationStatus.completed,
            ]),
            currentAssessment: {
              offering: {
                institutionLocation: { hasIntegration: true },
                offeringIntensity: OfferingIntensity.fullTime,
              },
            },
          },
        },
      },
    });
  }
}
