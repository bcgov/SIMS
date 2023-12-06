import { StudyBreak } from "@sims/sims-db";
import { EducationProgramOfferingService } from "../../..";
import { dateDifference } from "@sims/utilities";
import { OFFERING_STUDY_BREAK_MAX_DAYS } from "../../../../utilities";

describe("EducationProgramOfferingService-adjustStudyBreaks", () => {
  let studyBreaks: StudyBreak[];
  beforeAll(() => {
    studyBreaks = [
      {
        breakDays: 16,
        breakEndDate: "2023-12-16",
        breakStartDate: "2023-12-01",
        eligibleBreakDays: 16,
        ineligibleBreakDays: 0,
      },
    ];
  });

  it("Should return the same study break when new study end date is greater than the break end date.", () => {
    // Arrange
    const newStudyEndDate = "2023-12-30";

    // Act
    const adjustedStudyBreaks =
      EducationProgramOfferingService.adjustStudyBreaks(
        studyBreaks,
        newStudyEndDate,
      );

    // Assert
    expect(adjustedStudyBreaks).toStrictEqual(studyBreaks);
  });

  it("Should ignore the study break and return empty array when new study end date is less than the break start date.", () => {
    // Arrange
    const newStudyEndDate = "2023-11-01";

    // Act
    const adjustedStudyBreaks =
      EducationProgramOfferingService.adjustStudyBreaks(
        studyBreaks,
        newStudyEndDate,
      );

    // Assert
    expect(adjustedStudyBreaks).toStrictEqual([]);
  });

  it("Should adjust the study break when new study end date is in between the study break(inclusive).", () => {
    // Arrange
    const newStudyEndDate = "2023-12-05";

    // Act
    const adjustedStudyBreaks =
      EducationProgramOfferingService.adjustStudyBreaks(
        studyBreaks,
        newStudyEndDate,
      );

    // Assert
    const [studyBreak] = studyBreaks;
    const breakDays = dateDifference(
      newStudyEndDate,
      studyBreak.breakStartDate,
    );
    const eligibleBreakDays = Math.min(
      breakDays,
      OFFERING_STUDY_BREAK_MAX_DAYS,
    );

    expect(adjustedStudyBreaks).toStrictEqual([
      {
        breakStartDate: studyBreak.breakStartDate,
        breakEndDate: newStudyEndDate,
        breakDays: breakDays,
        eligibleBreakDays: eligibleBreakDays,
        ineligibleBreakDays: breakDays - eligibleBreakDays,
      },
    ]);
  });
});
