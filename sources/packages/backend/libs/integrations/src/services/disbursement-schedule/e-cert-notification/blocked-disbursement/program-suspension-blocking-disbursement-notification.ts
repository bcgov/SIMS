import { Injectable } from "@nestjs/common";
import {
  NotificationActionsService,
  ProgramSuspensionBlockingApplicationNotification,
  RestrictionCode,
} from "@sims/services";
import { Application, NotificationMessageType } from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { ECertNotification } from "../e-cert-notification";
import {
  ECertFailedValidation,
  EligibleECertDisbursement,
} from "../../disbursement-schedule.models";

/**
 * Creates a notification for a blocked disbursement due to a program suspension restriction for the ministry.
 */
@Injectable()
export class ProgramSuspensionBlockingDisbursementNotification extends ECertNotification {
  constructor(
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(
      "Program suspension blocking application",
      NotificationMessageType.ProgramSuspensionBlockingApplication,
    );
  }

  /**
   * Determines whether a notification should be created or not.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @returns true if a notification should be created, false otherwise.
   */
  protected async shouldCreateNotification(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<boolean> {
    const hasBlockingSuspensionRestriction =
      eCertDisbursement.failedValidations.some(
        (failedValidation) =>
          failedValidation.resultType ===
            ECertFailedValidation.HasStopDisbursementInstitutionRestriction &&
          failedValidation.additionalInfo.restrictionCodes.includes(
            RestrictionCode.SUS,
          ),
      );
    if (!hasBlockingSuspensionRestriction) {
      return false;
    }
    // Check if the notification already exists for the given disbursement
    // when there is an effective program suspension restriction.
    const hasNotification = await this.getExistingDisbursementNotification(
      eCertDisbursement,
      entityManager,
    );
    return !hasNotification;
  }

  /**
   * Creates a notification for the given e-Cert disbursement.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   */
  protected async createNotification(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<void> {
    const application = await entityManager
      .getRepository(Application)
      .findOneOrFail({
        select: {
          id: true,
          applicationNumber: true,
          student: {
            id: true,
            birthDate: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          currentAssessment: {
            id: true,
            offering: {
              id: true,
              educationProgram: { id: true, name: true },
              institutionLocation: {
                id: true,
                institution: { id: true, operatingName: true },
              },
            },
          },
        },
        relations: {
          currentAssessment: {
            offering: {
              educationProgram: true,
              institutionLocation: { institution: true },
            },
          },
          student: { user: true },
        },
        where: { id: eCertDisbursement.applicationId },
      });
    const notification: ProgramSuspensionBlockingApplicationNotification = {
      givenNames: application.student.user.firstName,
      lastName: application.student.user.lastName,
      studentEmail: application.student.user.email,
      birthDate: application.student.birthDate,
      applicationNumber: application.applicationNumber,
      institutionOperatingName:
        application.currentAssessment.offering.institutionLocation.institution
          .operatingName,
      programName: application.currentAssessment.offering.educationProgram.name,
      metadata: { disbursementId: eCertDisbursement.disbursement.id },
    };
    await this.notificationActionsService.saveProgramSuspensionBlockingApplicationNotification(
      [notification],
      entityManager,
    );
  }
}
