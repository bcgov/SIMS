import { compareApplicationData } from "../../application-data-comparison";

describe("Detect differences between student application data.", () => {
  it("Should return an empty array when no changes were detected.", () => {
    // Arrange
    const current = {
      bcResident: "yes",
      hasDependents: "no",
      calculatedTaxYear: 2023,
      myStudyPeriodIsntListed: {
        offeringnotListed: false,
      },
    };
    // Act
    const result = compareApplicationData(current, current);
    // Assert
    console.log(JSON.stringify(result, null, 2));
    expect(result).toHaveLength(0);
  });

  it("Should detected changes when the changes happened in primitive values at the first level including null and undefined.", () => {
    // Arrange
    const current = {
      bcResident: "yes",
      hasDependents: "no",
      calculatedTaxYear: 2023,
      isFullTimeAllowed: "",
      studentGivenNames: null,
      programYearEndDate: "2025-07-31",
      studentInfoConfirmed: true,
      showParentInformation: null,
      applicationPDPPDStatus: "no",
      myStudyPeriodIsntListed: {
        offeringnotListed: false,
      },
    };
    const previous = {
      bcResident: "changed yes",
      hasDependents: "changed no",
      calculatedTaxYear: 2000,
      // isFullTimeAllowed was removed from the properties and should be detected as changed.
      studentGivenNames: undefined,
      programYearEndDate: "2025-07-31",
      studentInfoConfirmed: true,
      showParentInformation: true,
      applicationPDPPDStatus: "changed no",
      myStudyPeriodIsntListed: {
        offeringnotListed: true,
      },
    };
    // Act
    const result = compareApplicationData(current, previous);
    // Assert
    expect(result).toEqual([
      {
        key: "bcResident",
        newValue: "yes",
        oldValue: "changed yes",
        changes: [],
      },
      {
        key: "hasDependents",
        newValue: "no",
        oldValue: "changed no",
        changes: [],
      },
      {
        key: "calculatedTaxYear",
        newValue: 2023,
        oldValue: 2000,
        changes: [],
      },
      {
        key: "isFullTimeAllowed",
        newValue: "",
        changes: [],
      },
      {
        key: "studentGivenNames",
        newValue: null,
        changes: [],
      },
      {
        key: "showParentInformation",
        newValue: null,
        oldValue: true,
        changes: [],
      },
      {
        key: "applicationPDPPDStatus",
        newValue: "no",
        oldValue: "changed no",
        changes: [],
      },
      {
        key: "myStudyPeriodIsntListed",
        changes: [
          {
            key: "offeringnotListed",
            newValue: false,
            oldValue: true,
            changes: [],
          },
        ],
      },
    ]);
  });
});
