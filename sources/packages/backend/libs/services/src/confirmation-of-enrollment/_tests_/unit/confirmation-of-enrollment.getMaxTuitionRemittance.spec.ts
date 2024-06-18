import { ConfirmationOfEnrollmentService } from "@sims/services/confirmation-of-enrollment/confirmation-of-enrollment.service";
import { DisbursementSchedule, DisbursementValueType } from "@sims/sims-db";
import { DataSource, Repository } from "typeorm";
import { MaxTuitionRemittanceTypes } from "../../models/confirmation-of-enrollment.models";
import { SequenceControlService } from "@sims/services/sequence-control/sequence-control.service";
import { NotificationActionsService } from "@sims/services/notifications";
import { AssessmentSequentialProcessingService } from "@sims/services/students-assessments/assessment-sequential-processing.service";
import { SystemUsersService } from "@sims/services/system-users";

describe("ConfirmationOfEnrollmentService-getMaxTuitionRemittance", () => {
  let service: ConfirmationOfEnrollmentService;

  beforeAll(() => {
    // disbursementScheduleRepo is not a dependency for getMaxTuitionRemittance.
    const dataSource = {} as DataSource;
    const disbursementScheduleRepo = {} as Repository<DisbursementSchedule>;
    const sequenceService = {} as SequenceControlService;
    const notificationActionsService = {} as NotificationActionsService;
    const assessmentSequentialProcessingService =
      {} as AssessmentSequentialProcessingService;
    const systemUsersService = {} as SystemUsersService;
    service = new ConfirmationOfEnrollmentService(
      disbursementScheduleRepo,
      dataSource,
      sequenceService,
      notificationActionsService,
      assessmentSequentialProcessingService,
      systemUsersService,
    );
  });

  it("Should calculate total estimated value from awards when awards are lesser than offering costs", () => {
    // Arrange
    const awards = [
      {
        valueType: DisbursementValueType.CanadaLoan,
        valueAmount: 100,
        disbursedAmountSubtracted: 50,
      },
      {
        valueType: DisbursementValueType.BCLoan,
        valueAmount: 200,
      },
      {
        valueType: DisbursementValueType.CanadaGrant,
        valueAmount: 300,
        disbursedAmountSubtracted: 100,
      },
      {
        // Must be ignored from the total during calculation.
        valueType: DisbursementValueType.BCGrant,
        valueAmount: 500,
      },
      {
        // Must be ignored from the total during calculation.
        valueType: DisbursementValueType.BCTotalGrant,
        valueAmount: 500,
      },
    ];
    const offeringCosts = {
      actualTuitionCosts: Number.MAX_SAFE_INTEGER,
      programRelatedCosts: Number.MAX_SAFE_INTEGER,
      mandatoryFees: Number.MAX_SAFE_INTEGER,
    };
    // Act
    const total = service.getMaxTuitionRemittance(
      awards,
      offeringCosts,
      MaxTuitionRemittanceTypes.Estimated,
    );
    // Assert
    expect(total).toBe(450);
  });

  it("Should calculate total estimated value from offerings costs when offerings costs are lesser than awards", () => {
    // Arrange
    const awards = [
      {
        valueType: DisbursementValueType.CanadaLoan,
        valueAmount: Number.MAX_SAFE_INTEGER,
      },
    ];
    const offeringCosts = {
      actualTuitionCosts: 100,
      programRelatedCosts: 300,
      mandatoryFees: 50,
    };
    // Act
    const total = service.getMaxTuitionRemittance(
      awards,
      offeringCosts,
      MaxTuitionRemittanceTypes.Estimated,
    );
    // Assert
    expect(total).toBe(450);
  });

  it("Should calculate total effective value from awards when awards are lesser than offering costs", () => {
    // Arrange
    const awards = [
      {
        valueType: DisbursementValueType.CanadaLoan,
        valueAmount: Number.MAX_SAFE_INTEGER, // Must be ignored during calculation.
        effectiveAmount: 100,
      },
      {
        valueType: DisbursementValueType.BCLoan,
        valueAmount: Number.MAX_SAFE_INTEGER, // Must be ignored during calculation.
        effectiveAmount: 200,
      },
      {
        valueType: DisbursementValueType.CanadaGrant,
        valueAmount: Number.MAX_SAFE_INTEGER, // Must be ignored during calculation.
        effectiveAmount: 300,
      },
    ];
    const offeringCosts = {
      actualTuitionCosts: Number.MAX_SAFE_INTEGER,
      programRelatedCosts: Number.MAX_SAFE_INTEGER,
      mandatoryFees: Number.MAX_SAFE_INTEGER,
    };
    // Act
    const total = service.getMaxTuitionRemittance(
      awards,
      offeringCosts,
      MaxTuitionRemittanceTypes.Effective,
    );
    // Assert
    expect(total).toBe(600);
  });

  it("Should calculate total effective value from offerings costs when offerings costs are lesser than awards", () => {
    // Arrange
    const awards = [
      {
        valueType: DisbursementValueType.CanadaLoan,
        valueAmount: Number.MAX_SAFE_INTEGER, // Must be ignored during calculation.
        effectiveAmount: Number.MAX_SAFE_INTEGER,
      },
    ];
    const offeringCosts = {
      actualTuitionCosts: 25,
      programRelatedCosts: 75,
      mandatoryFees: 15,
    };
    // Act
    const total = service.getMaxTuitionRemittance(
      awards,
      offeringCosts,
      MaxTuitionRemittanceTypes.Effective,
    );
    // Assert
    expect(total).toBe(115);
  });

  it("Should discount previous tuition remittance value when there is a previous tuition remittance.", () => {
    // Arrange
    const awards = [
      {
        valueType: DisbursementValueType.CanadaLoan,
        valueAmount: 100,
        disbursedAmountSubtracted: 50,
      },
      {
        valueType: DisbursementValueType.BCLoan,
        valueAmount: 200,
      },
      {
        valueType: DisbursementValueType.CanadaGrant,
        valueAmount: 300,
        disbursedAmountSubtracted: 100,
      },
    ];
    const offeringCosts = {
      actualTuitionCosts: Number.MAX_SAFE_INTEGER,
      programRelatedCosts: Number.MAX_SAFE_INTEGER,
      mandatoryFees: Number.MAX_SAFE_INTEGER,
    };
    // Act
    const total = service.getMaxTuitionRemittance(
      awards,
      offeringCosts,
      MaxTuitionRemittanceTypes.Estimated,
      300,
    );
    // Assert
    expect(total).toBe(150);
  });
});
