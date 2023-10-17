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
    payloadDisbursementSchedule = {
      updatedAt: addDays(1, new Date()),
      disbursementDate: addToDateOnlyString(new Date(), -1, "d"),
      dateSent: addDays(2, new Date()),
      disbursementFeedbackErrors: [
        {
          errorCode: FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS[0],
          updatedAt: addDays(-2, new Date()),
        } as DisbursementFeedbackErrors,
      ],
    };
  });

  it(
    `Should return ${payloadApplication.applicationStatusUpdatedOn} when application event code` +
      `  is ${ApplicationEventCode.COER} and application status is ${ApplicationStatus.Enrolment}.`,
    async () => {
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
    `Should return ${payloadDisbursementSchedule.updatedAt} when application event code` +
      `  is ${ApplicationEventCode.COER} and application status is not ${ApplicationStatus.Completed}.`,
    async () => {
      // Act
      const applicationEventDate =
        applicationEventDateUtilsService.getApplicationEventDate(
          ApplicationEventCode.COER,
          {
            ...payloadApplication,
            applicationStatus: ApplicationStatus.Completed,
          },
          payloadDisbursementSchedule,
        );
      // Assert
      expect(applicationEventDate).toBe(payloadDisbursementSchedule.updatedAt);
    },
  );

  it(`Should return disbursementFeedbackErrors updatedAt when application event code is ${ApplicationEventCode.DISE}.`, async () => {
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

  it(`Should return ${addDays(
    -DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
    payloadDisbursementSchedule.disbursementDate,
  )} when application event code is ${
    ApplicationEventCode.DISR
  }.`, async () => {
    // Act
    const applicationEventDate =
      applicationEventDateUtilsService.getApplicationEventDate(
        ApplicationEventCode.DISR,
        payloadApplication,
        payloadDisbursementSchedule,
      );
    // Assert
    expect(applicationEventDate).toBe(
      addDays(
        -DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
        payloadDisbursementSchedule.disbursementDate,
      ),
    );
  });

  it(`Should return ${payloadDisbursementSchedule.dateSent} when application event code is ${ApplicationEventCode.DISW}.`, async () => {
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

  it(`Should return ${payloadDisbursementSchedule.dateSent} when application event code is ${ApplicationEventCode.DISS}.`, async () => {
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
    `Should return ${payloadDisbursementSchedule.updatedAt} when application event code is other than` +
      ` ${ApplicationEventCode.COER}, ${ApplicationEventCode.DISE}, ${ApplicationEventCode.DISR}, ${ApplicationEventCode.DISW}, ${ApplicationEventCode.DISS}.`,
    async () => {
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
