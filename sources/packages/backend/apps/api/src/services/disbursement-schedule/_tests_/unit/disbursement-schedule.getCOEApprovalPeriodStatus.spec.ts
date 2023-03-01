import {
  NotificationActionsService,
  SequenceControlService,
} from "@sims/services";
import { DisbursementScheduleService } from "../../disbursement-schedule-service";
import { DataSource } from "typeorm";
import { addDays } from "@sims/utilities";
import { COE_WINDOW } from "../../../../utilities";
import { COEApprovalPeriodStatus } from "../../disbursement-schedule.models";

describe("DisbursementScheduleService-getCOEApprovalPeriodStatus", () => {
  let service: DisbursementScheduleService;

  beforeAll(async () => {
    const dataSource = {} as DataSource;
    dataSource.getRepository = jest.fn();
    const sequenceService = {} as SequenceControlService;
    const notificationActionsService = {} as NotificationActionsService;
    service = new DisbursementScheduleService(
      dataSource,
      sequenceService,
      notificationActionsService,
    );
  });

  it("Should throw an error when the disbursement date is undefined.", () => {
    // Arrange
    const disbursementDate = undefined;
    const studyEndDate = new Date();

    // Act and Assert.
    expect(() => {
      service.getCOEApprovalPeriodStatus(disbursementDate, studyEndDate);
    }).toThrow(
      "disbursementDate and studyEndDate are required for COE window verification.",
    );
  });

  it("Should throw an error when both the disbursement date and study end date are undefined.", () => {
    // Arrange
    const disbursementDate = undefined;
    const studyEndDate = undefined;

    // Act and Assert.
    expect(() => {
      service.getCOEApprovalPeriodStatus(disbursementDate, studyEndDate);
    }).toThrow(
      "disbursementDate and studyEndDate are required for COE window verification.",
    );
  });

  it(`Should return "${COEApprovalPeriodStatus.WithinApprovalPeriod}" when enrolment now is the first day of (within) the allowed approval period.`, () => {
    // Arrange
    const disbursementDate = addDays(COE_WINDOW, new Date());
    const studyEndDate = addDays(60, new Date());

    // Act
    const coeApprovalPeriodStatus = service.getCOEApprovalPeriodStatus(
      disbursementDate,
      studyEndDate,
    );

    // Assert.
    expect(coeApprovalPeriodStatus).toEqual(
      COEApprovalPeriodStatus.WithinApprovalPeriod,
    );
  });

  it(`Should return "${COEApprovalPeriodStatus.WithinApprovalPeriod}" when enrolment now is the last day of (within) the allowed approval period.`, () => {
    // Arrange
    const disbursementDate = addDays(COE_WINDOW, new Date());
    const studyEndDate = new Date();

    // Act
    const coeApprovalPeriodStatus = service.getCOEApprovalPeriodStatus(
      disbursementDate,
      studyEndDate,
    );

    // Assert.
    expect(coeApprovalPeriodStatus).toEqual(
      COEApprovalPeriodStatus.WithinApprovalPeriod,
    );
  });

  it(`Should return "${COEApprovalPeriodStatus.BeforeApprovalPeriod}" when enrolment now is before the eligible approval period.`, () => {
    // Arrange
    const disbursementDate = addDays(COE_WINDOW + 1, new Date());
    const studyEndDate = addDays(60, new Date());

    // Act
    const coeApprovalPeriodStatus = service.getCOEApprovalPeriodStatus(
      disbursementDate,
      studyEndDate,
    );

    // Assert.
    expect(coeApprovalPeriodStatus).toEqual(
      COEApprovalPeriodStatus.BeforeApprovalPeriod,
    );
  });

  it(`Should return "${COEApprovalPeriodStatus.AfterApprovalPeriod}" when enrolment now is after the eligible approval period.`, () => {
    // Arrange
    const disbursementDate = addDays(-30, new Date());
    const studyEndDate = addDays(-1, new Date());

    // Act
    const coeApprovalPeriodStatus = service.getCOEApprovalPeriodStatus(
      disbursementDate,
      studyEndDate,
    );

    // Assert.
    expect(coeApprovalPeriodStatus).toEqual(
      COEApprovalPeriodStatus.AfterApprovalPeriod,
    );
  });
});
