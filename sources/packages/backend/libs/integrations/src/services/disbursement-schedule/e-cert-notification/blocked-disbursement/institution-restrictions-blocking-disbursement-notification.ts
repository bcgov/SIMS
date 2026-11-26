import { Injectable } from "@nestjs/common";
import {
  InstitutionRestrictionBlockingApplicationNotification,
  NotificationActionsService,
  RestrictionCode,
} from "@sims/services";
import {
  Application,
  NotificationMessageType,
  Notification,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { ECertNotification } from "../e-cert-notification";
import {
  ECertFailedValidation,
  EligibleECertDisbursement,
} from "../../disbursement-schedule.models";

/**
 * Restriction codes that block disbursement acceptance.
 */
const DISBURSEMENT_BLOCKING_RESTRICTION_CODES = new Set([
  RestrictionCode.SUS,
  RestrictionCode.LSC,
]);

/**
 * Creates a notification for a blocked disbursement due to institution restrictions.
 */
@Injectable()
export class InstitutionRestrictionsBlockingDisbursementNotification extends ECertNotification {
  constructor(
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(
      "Institution restriction blocking application",
      NotificationMessageType.InstitutionRestrictionBlockingApplication,
    );
  }

  /**
   * Determines if a notification should be created based on the restriction codes.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @returns restriction codes that need notifications as additional info.
   */
  protected async shouldCreateNotification<T = RestrictionCode[]>(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<{ shouldCreateNotification: boolean; additionalInfo?: T }> {
    const blockingRestrictions =
      this.getBlockingRestrictionCodes(eCertDisbursement);
    if (!blockingRestrictions.length) {
      return { shouldCreateNotification: false };
    }
    // Get restriction codes for which notifications have already been sent
    const sentRestrictionCodes =
      await this.getSentRestrictionCodesForDisbursement(
        eCertDisbursement,
        entityManager,
      );
    // Return only restriction codes that need notifications
    const restrictionCodesToSend = blockingRestrictions.filter(
      (code) => !sentRestrictionCodes.includes(code),
    );
    return {
      shouldCreateNotification: restrictionCodesToSend.length > 0,
      additionalInfo: restrictionCodesToSend as T,
    };
  }

  /**
   * Gets the restriction codes that are blocking this disbursement.
   * @param eCertDisbursement eligible disbursement to check.
   * @returns array of restriction codes that block the disbursement.
   */
  private getBlockingRestrictionCodes(
    eCertDisbursement: EligibleECertDisbursement,
  ): RestrictionCode[] {
    const blockingCodes: RestrictionCode[] = [];
    for (const failedValidation of eCertDisbursement.failedValidations) {
      if (
        failedValidation.resultType ===
        ECertFailedValidation.HasStopDisbursementInstitutionRestriction
      ) {
        for (const restriction of failedValidation.additionalInfo
          .restrictions) {
          const code = restriction.code as RestrictionCode;
          if (
            DISBURSEMENT_BLOCKING_RESTRICTION_CODES.has(code) &&
            !blockingCodes.includes(code)
          ) {
            blockingCodes.push(code);
          }
        }
      }
    }
    return blockingCodes;
  }

  /**
   * Gets the restriction codes for which notifications have already been sent for this disbursement.
   * @param eCertDisbursement eligible disbursement to check.
   * @param entityManager entity manager to execute in transaction.
   * @returns array of restriction codes that already have notifications sent.
   */
  private async getSentRestrictionCodesForDisbursement(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
  ): Promise<RestrictionCode[]> {
    const notifications = await entityManager.getRepository(Notification).find({
      select: { id: true, metadata: true },
      where: {
        notificationMessage: {
          id: this.notificationMessageType,
        },
        metadata: {
          disbursementId: eCertDisbursement.disbursement.id,
        },
      },
    });
    const sentCodes: RestrictionCode[] = [];
    for (const notification of notifications) {
      const restrictionCode = (notification.metadata as Record<string, unknown>)
        .restrictionCode as RestrictionCode | undefined;
      if (restrictionCode && !sentCodes.includes(restrictionCode)) {
        sentCodes.push(restrictionCode);
      }
    }
    return sentCodes;
  }

  /**
   * Creates a notification for the given e-Cert disbursement.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager entity manager to execute in transaction.
   * @param additionalInfo restriction codes that require notifications.
   */
  protected async createNotification(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    additionalInfo?: unknown,
  ): Promise<void> {
    const restrictionCodes = additionalInfo as RestrictionCode[];
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
                institution: {
                  id: true,
                  operatingName: true,
                },
                name: true,
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
    // Create one notification per restriction code
    const notifications: InstitutionRestrictionBlockingApplicationNotification[] =
      [];
    for (const restrictionCode of restrictionCodes) {
      notifications.push({
        givenNames: application.student.user.firstName,
        lastName: application.student.user.lastName,
        studentEmail: application.student.user.email,
        birthDate: application.student.birthDate,
        applicationNumber: application.applicationNumber,
        institutionOperatingName:
          application.currentAssessment.offering.institutionLocation.institution
            .operatingName,
        locationName:
          application.currentAssessment.offering.institutionLocation.name,
        programName:
          application.currentAssessment.offering.educationProgram.name,
        metadata: {
          disbursementId: eCertDisbursement.disbursement.id,
          restrictionCode,
        },
      });
    }
    if (notifications.length) {
      await this.notificationActionsService.saveInstitutionRestrictionBlockingApplicationNotification(
        notifications,
        entityManager,
      );
    }
  }
}
