import {
  Application,
  ApplicationStatus,
  DisbursementFeedbackErrors,
} from "@sims/sims-db";
import {
  ApplicationEventCode,
  DisbursementScheduleForApplicationEventDate,
} from "../../../models/ier12-integration.model";
import { ApplicationEventDateUtilsService } from "../..";
import { addDays, addToDateOnlyString } from "@sims/utilities";
import { FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/services/constants";

describe("ApplicationEventDateUtilsService-getApplicationEventDate", () => {
  let applicationEventDateUtilsService: ApplicationEventDateUtilsService;
  let payloadApplication: Pick<
    Application,
    "applicationStatus" | "applicationStatusUpdatedOn"
  >;
  let payloadDisbursementSchedule: DisbursementScheduleForApplicationEventDate;

  beforeAll(() => {
    applicationEventDateUtilsService = new ApplicationEventDateUtilsService();

    // Arrange.
    payloadApplication = {
      applicationStatus: ApplicationStatus.Enrolment,
      applicationStatusUpdatedOn: new Date(),
    };
    const [feedbackErrorCode] = FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS;
    payloadDisbursementSchedule = {
      updatedAt: addDays(1, new Date()),
      disbursementDate: addToDateOnlyString(new Date(), -1, "d"),
      dateSent: addDays(2, new Date()),
      disbursementFeedbackErrors: [
        {
          eCertFeedbackError: { errorCode: feedbackErrorCode },
          updatedAt: addDays(-2, new Date()),
        } as DisbursementFeedbackErrors,
      ],
    };
  });

  it(
    `Should return payloadApplication.applicationStatusUpdatedOn when application event code ` +
      `is ${ApplicationEventCode.COER} and application status is ${ApplicationStatus.Enrolment}.`,
    () => {
      // Act
      const applicationEventDate =
        applicationEventDateUtilsService.getApplicationEventDate(
          ApplicationEventCode.COER,
          payloadApplication,
          payloadDisbursementSchedule,
        );

      // Assert
      expect(applicationEventDate).toBe(
        payloadApplication.applicationStatusUpdatedOn,
      );
    },
  );

  it(
    `Should return payloadDisbursementSchedule.updatedAt when application event code ` +
      `is ${ApplicationEventCode.COER} and application status is not ${ApplicationStatus.Enrolment}.`,
    () => {
      // Arrange
      const application = {
        ...payloadApplication,
        applicationStatus: ApplicationStatus.Completed,
      };

      // Act
      const applicationEventDate =
        applicationEventDateUtilsService.getApplicationEventDate(
          ApplicationEventCode.COER,
          application,
          payloadDisbursementSchedule,
        );

      // Assert
      expect(applicationEventDate).toBe(payloadDisbursementSchedule.updatedAt);
    },
  );

  it(`Should return disbursementFeedbackErrors updatedAt when application event code is ${ApplicationEventCode.DISE}.`, () => {
    // Act
    const applicationEventDate =
      applicationEventDateUtilsService.getApplicationEventDate(
        ApplicationEventCode.DISE,
        payloadApplication,
        payloadDisbursementSchedule,
      );

    // Assert
    const [{ updatedAt }] =
      payloadDisbursementSchedule.disbursementFeedbackErrors;
    expect(applicationEventDate).toBe(updatedAt);
  });

  it(`Should return payloadDisbursementSchedule.disbursementDate - ${DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS} when application event code is ${ApplicationEventCode.DISR}.`, () => {
    // Act
    const applicationEventDate =
      applicationEventDateUtilsService.getApplicationEventDate(
        ApplicationEventCode.DISR,
        payloadApplication,
        payloadDisbursementSchedule,
      );

    // Assert
    expect(applicationEventDate).toStrictEqual(
      addDays(
        -DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
        payloadDisbursementSchedule.disbursementDate,
      ),
    );
  });

  it(`Should return payloadDisbursementSchedule.dateSent when application event code is ${ApplicationEventCode.DISW}.`, () => {
    // Act
    const applicationEventDate =
      applicationEventDateUtilsService.getApplicationEventDate(
        ApplicationEventCode.DISW,
        payloadApplication,
        payloadDisbursementSchedule,
      );

    // Assert
    expect(applicationEventDate).toBe(payloadDisbursementSchedule.dateSent);
  });

  it(`Should return payloadDisbursementSchedule.dateSent when application event code is ${ApplicationEventCode.DISS}.`, () => {
    // Act
    const applicationEventDate =
      applicationEventDateUtilsService.getApplicationEventDate(
        ApplicationEventCode.DISS,
        payloadApplication,
        payloadDisbursementSchedule,
      );

    // Assert
    expect(applicationEventDate).toBe(payloadDisbursementSchedule.dateSent);
  });

  it(
    `Should return payloadDisbursementSchedule.updatedAt when application event code is other than ` +
      `${ApplicationEventCode.COER}, ${ApplicationEventCode.DISE}, ${ApplicationEventCode.DISR}, ${ApplicationEventCode.DISW}, ${ApplicationEventCode.DISS}.`,
    () => {
      // Act
      const applicationEventDate =
        applicationEventDateUtilsService.getApplicationEventDate(
          ApplicationEventCode.ASMT,
          payloadApplication,
          payloadDisbursementSchedule,
        );

      // Assert
      expect(applicationEventDate).toBe(payloadDisbursementSchedule.updatedAt);
    },
  );
});
