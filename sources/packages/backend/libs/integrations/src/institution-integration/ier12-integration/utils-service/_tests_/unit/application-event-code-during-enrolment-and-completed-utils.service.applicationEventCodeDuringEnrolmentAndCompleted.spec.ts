import { COEStatus } from "@sims/sims-db";
import { ApplicationEventCode } from "../../../models/ier12-integration.model";
import { ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService } from "../..";

describe("ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService-applicationEventCodeDuringEnrolmentAndCompleted", () => {
  let applicationEventCodeDuringEnrolmentAndCompletedUtilsService: ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService;

  beforeAll(() => {
    applicationEventCodeDuringEnrolmentAndCompletedUtilsService =
      new ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService();
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

  it(`Should throw an error when the coe status is other than ${COEStatus.required} or ${COEStatus.declined}.`, () => {
    // Act and assert.
    expect(() => {
      applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringEnrolmentAndCompleted(
        COEStatus.completed,
      );
    }).toThrow("Unexpected COE status.");
  });
});
