import { Injectable } from "@nestjs/common";
import {
  ApplicationStatus,
  DisbursementSchedule,
  MSFAANumber,
  OfferingIntensity,
  RecordDataModelService,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";

import { DataSource, IsNull, Not } from "typeorm";
import { MSFAANumberService } from "..";
import {
  APPLICATION_MSFAA_ALREADY_ASSOCIATED,
  DISBURSEMENT_NOT_FOUND,
} from "../../constants";

@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    dataSource: DataSource,
    private readonly msfaaNumberService: MSFAANumberService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
  }

  /**
   * Associates an MSFAA number to the application checking
   * whatever is needed to create a new MSFAA or use an
   * existing one instead.
   * @param assessmentId application id to receive an MSFAA.
   * @returns application saved with the MSFAA associated.
   */
  async associateMSFAANumber(assessmentId: number): Promise<void> {
    const [firstDisbursement, secondDisbursement] = await this.repo.find({
      select: {
        id: true,
        studentAssessment: {
          id: true,
          application: { id: true, student: { id: true } },
          offering: { id: true, offeringIntensity: true, studyStartDate: true },
        },
        msfaaNumber: {
          id: true,
        },
      },
      relations: {
        studentAssessment: { application: { student: true }, offering: true },
        msfaaNumber: true,
      },
      where: {
        studentAssessment: { id: assessmentId },
      },
    });

    if (!firstDisbursement) {
      throw new CustomNamedError(
        "Disbursement not found or one of its associations is missing.",
        DISBURSEMENT_NOT_FOUND,
      );
    }

    if (firstDisbursement.msfaaNumber?.id) {
      throw new CustomNamedError(
        "MSFAA number is already associated.",
        APPLICATION_MSFAA_ALREADY_ASSOCIATED,
      );
    }

    let msfaaNumberId: number;

    const studentId =
      firstDisbursement.studentAssessment.application.student.id;
    const offeringIntensity =
      firstDisbursement.studentAssessment.offering.offeringIntensity;
    const applicationId = firstDisbursement.studentAssessment.application.id;

    // Checks if there is an MSFAA that could be considered valid.
    const existingValidMSFAANumber =
      await this.msfaaNumberService.getCurrentValidMSFAANumber(
        studentId,
        offeringIntensity,
      );
    if (existingValidMSFAANumber) {
      // Reuse the MSFAA that is still valid and avoid creating a new one.
      msfaaNumberId = existingValidMSFAANumber.id;
    } else {
      // Get previously completed and signed application for the student
      // to determine if an existing MSFAA is still valid.
      const previousSignedDisbursement =
        await this.getPreviouslySignedDisbursement(
          studentId,
          offeringIntensity,
        );

      let hasValidMSFAANumber = false;
      if (previousSignedDisbursement) {
        // checks if the MSFAA number is still valid.
        hasValidMSFAANumber = this.msfaaNumberService.isMSFAANumberValid(
          // Previously signed and completed application offering end date in considered the start date.
          new Date(
            previousSignedDisbursement.studentAssessment.offering.studyEndDate,
          ),
          // Start date of the offering of the current application is considered the end date.
          new Date(firstDisbursement.studentAssessment.offering.studyStartDate),
        );
      }

      if (hasValidMSFAANumber) {
        // Reuse the MSFAA number.
        msfaaNumberId = previousSignedDisbursement.msfaaNumber.id;
      } else {
        // Create a new MSFAA number case the previous one is no longer valid.
        const newMSFAANumber = await this.msfaaNumberService.createMSFAANumber(
          studentId,
          applicationId,
          offeringIntensity,
        );
        msfaaNumberId = newMSFAANumber.id;
      }
    }
    const msfaaNumber = { id: msfaaNumberId } as MSFAANumber;
    firstDisbursement.msfaaNumber = msfaaNumber;
    const disbursementsToUpdate = [firstDisbursement];

    // If the assessment has second disbursement, associate MSFAA number
    // and add to the disbursements to be updated.
    if (secondDisbursement) {
      secondDisbursement.msfaaNumber = msfaaNumber;
      disbursementsToUpdate.push(secondDisbursement);
    }

    this.repo.save(disbursementsToUpdate);
  }

  /**
   * Get the previously signed MSFAA for the student
   * for given offering intensity if exist.
   ** MSFAA is generated individually for full-time/part-time
   ** offerings.
   * @param studentId student.
   * @param offeringIntensity  offering intensity.
   * @returns previous signed MSFAA if exist.
   */
  async getPreviouslySignedDisbursement(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<DisbursementSchedule> {
    return this.repo.findOne({
      select: {
        id: true,
        studentAssessment: {
          id: true,
          offering: { id: true, studyEndDate: true },
        },
        msfaaNumber: { id: true },
      },
      relations: {
        studentAssessment: { offering: true },
        msfaaNumber: true,
      },
      where: {
        studentAssessment: {
          offering: { offeringIntensity },
          application: {
            student: { id: studentId },
            applicationStatus: ApplicationStatus.Completed,
          },
        },
        msfaaNumber: {
          dateSigned: Not(IsNull()),
          cancelledDate: IsNull(),
        },
      },
      order: { studentAssessment: { offering: { studyEndDate: "DESC" } } },
    });
  }
}
