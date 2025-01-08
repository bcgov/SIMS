// Target module
import { compareApplicationData } from "../../application-data-comparison";
import * as util from "util";

describe("Detect differences between student application data.", () => {
  it("Should detected changes when there are changes.", () => {
    // Arrange
    const dataA = {
      bcResident: "yes",
      dependants: [
        {
          fullName: "a",
          dateOfBirth: "2024-10-01",
          declaredOnTaxes: "no",
          attendingPostSecondarySchool: "no",
        },
      ],
      citizenship: "canadianCitizen",
      courseDetails: [
        {
          courseCode: "A",
          courseName: "a",
          courseEndDate: "2024-10-31",
          courseStartDate: "2024-10-01",
        },
      ],
      hasDependents: "yes",
      calculatedTaxYear: 2023,
      isFullTimeAllowed: "",
      studentGivenNames: null,
      myProgramNotListed: null,
      programYearEndDate: "2025-07-31",
      studentInfoConfirmed: true,
      showParentInformation: null,
      applicationPDPPDStatus: "no",
      myStudyPeriodIsntListed: {
        offeringnotListed: false,
      },
      selectedStudyEndDateBeforeSixWeeksFromToday: false,
    };
    const dataB = {
      bcResident: "yes",
      dependants: [
        {
          fullName: "a",
          dateOfBirth: "2024-10-01",
          declaredOnTaxes: "no",
          attendingPostSecondarySchool: "no",
        },
        {
          fullName: "b",
          dateOfBirth: "2024-10-01",
          declaredOnTaxes: "yes",
          attendingPostSecondarySchool: "no",
        },
      ],
      citizenship: "canadianCitizen",
      courseDetails: [
        {
          courseCode: "A",
          courseName: "a",
          courseEndDate: "2024-10-31",
          courseStartDate: "2024-10-01",
        },
      ],
      hasDependents: "yes",
      calculatedTaxYear: 2023,
      isFullTimeAllowed: "",
      studentGivenNames: null,
      myProgramNotListed: null,
      programYearEndDate: "2025-07-31",
      studentInfoConfirmed: true,
      showParentInformation: null,
      applicationPDPPDStatus: "no",
      myStudyPeriodIsntListed: {
        offeringnotListed: false,
      },
      selectedStudyEndDateBeforeSixWeeksFromToday: false,
    };
    // Act
    const result = compareApplicationData(dataA, dataB);
    // Assert
    console.log(JSON.stringify(result, null, 2));
    expect(result).toEqual([
      {
        key: "dependants",
        changes: [
          {
            changes: [
              {
                key: "declaredOnTaxes",
                newValue: "no",
                oldValue: "yes",
                index: 0,
                changes: [],
              },
            ],
          },
        ],
      },
    ]);
  });
});
