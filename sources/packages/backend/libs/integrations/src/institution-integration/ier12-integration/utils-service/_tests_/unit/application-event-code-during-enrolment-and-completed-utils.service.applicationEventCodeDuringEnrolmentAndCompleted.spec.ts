import { COEStatus } from "@sims/sims-db";
import { ApplicationEventCode } from "../../../models/ier12-integration.model";
import { ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService } from "../..";
import { DisbursementValueService } from "@sims/integrations/services";
import { createMock } from "@golevelup/ts-jest";
// todo: ann double check the unit test file name with the team.

describe("ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService-applicationEventCodeDuringEnrolmentAndCompleted", () => {
  let applicationEventCodeDuringEnrolmentAndCompletedUtilsService: ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService;
  beforeAll(() => {
    const disbursementValueService = createMock<DisbursementValueService>();
    applicationEventCodeDuringEnrolmentAndCompletedUtilsService =
      new ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService(
        disbursementValueService,
      );
  });

  it(`Should return ${ApplicationEventCode.COER} when the coe status is ${COEStatus.required}.`, () => {
    // Act
    const applicationEventCode =
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringEnrolmentAndCompleted(
        COEStatus.required,
      );
    // Assert
    expect(applicationEventCode).toBe(ApplicationEventCode.COER);
  });

  it(`Should return ${ApplicationEventCode.COED} when the coe status is ${COEStatus.declined}.`, () => {
    // Act
    const applicationEventCode =
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringEnrolmentAndCompleted(
        COEStatus.declined,
      );
    // Assert
    expect(applicationEventCode).toBe(ApplicationEventCode.COED);
  });

  it(`Should throw error when the coe status is ${COEStatus.completed}.`, () => {
    // Assert
    expect(() => {
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringEnrolmentAndCompleted(
        COEStatus.completed,
      );
    }).toThrow("Unexpected coe status.");
  });
});
