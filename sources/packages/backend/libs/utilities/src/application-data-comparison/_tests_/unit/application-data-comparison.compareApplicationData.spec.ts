import { compareApplicationData } from "../../application-data-comparison";

describe("compareApplicationData", () => {
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

  it("Should detected changes when the changes happened in primitive values at the first level including null to undefined or vice versa.", () => {
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
        index: undefined,
        changeType: "updated",
        changes: [],
      },
      {
        key: "hasDependents",
        newValue: "no",
        oldValue: "changed no",
        index: undefined,
        changeType: "updated",
        changes: [],
      },
      {
        key: "calculatedTaxYear",
        newValue: 2023,
        oldValue: 2000,
        index: undefined,
        changeType: "updated",
        changes: [],
      },
      {
        key: "isFullTimeAllowed",
        newValue: "",
        oldValue: undefined,
        index: undefined,
        changeType: "updated",
        changes: [],
      },
      {
        key: "studentGivenNames",
        newValue: null,
        oldValue: undefined,
        index: undefined,
        changeType: "updated",
        changes: [],
      },
      {
        key: "showParentInformation",
        newValue: null,
        oldValue: true,
        index: undefined,
        changeType: "updated",
        changes: [],
      },
      {
        key: "applicationPDPPDStatus",
        newValue: "no",
        oldValue: "changed no",
        index: undefined,
        changeType: "updated",
        changes: [],
      },
      {
        key: "myStudyPeriodIsntListed",
        newValue: undefined,
        oldValue: undefined,
        index: undefined,
        changeType: "updated",
        changes: [
          {
            key: "offeringnotListed",
            newValue: false,
            oldValue: true,
            index: undefined,
            changeType: "updated",
            changes: [],
          },
        ],
      },
    ]);
  });

  it("Should detected items removed in an array when the current data array has fewer items than the previous.", () => {
    // Arrange
    const current = {
      dependants: [
        {
          fullName: "My son 1",
          dateOfBirth: "2025-01-02",
        },
      ],
    };
    const previous = {
      dependants: [
        {
          fullName: "My son 1",
          dateOfBirth: "2025-01-02",
        },
        {
          fullName: "My son 2",
          dateOfBirth: "2025-01-02",
        },
      ],
    };

    // Act
    const result = compareApplicationData(current, previous);

    // Assert
    expect(result).toEqual([
      {
        key: "dependants",
        changeType: "itemsRemoved",
        changes: [],
      },
    ]);
  });

  it("Should detected items changed in an array at any level when the current data has at least one different property from the previous data.", () => {
    // Arrange
    const current = {
      dependants: [
        {
          fullName: "My son 1",
          dateOfBirth: "2025-01-02",
          someFilesArray: [
            {
              url: "student/files/FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
              name: "FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
              originalName: "FileNameA.txt",
            },
            {
              url: "student/files/FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
              name: "FileNameA-3370396b-8460-41d3-bb47-198ee84cc528_SOMETHING_CHANGED.txt",
              originalName: "FileNameA.txt",
            },
          ],
        },
      ],
    };
    const previous = {
      dependants: [
        {
          fullName: "My son 1",
          dateOfBirth: "2025-01-02",
          someFilesArray: [
            {
              url: "student/files/FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
              name: "FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
              originalName: "FileNameA.txt",
            },
            {
              url: "student/files/FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
              name: "FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
              originalName: "FileNameA.txt",
            },
          ],
        },
      ],
    };

    // Act
    const result = compareApplicationData(current, previous);

    // Assert
    expect(result).toEqual([
      {
        key: "dependants",
        changeType: "updated",
        changes: [
          {
            index: 0,
            changeType: "updated",
            changes: [
              {
                key: "someFilesArray",
                changeType: "updated",
                changes: [
                  {
                    index: 1,
                    changeType: "updated",
                    changes: [
                      {
                        key: "name",
                        newValue:
                          "FileNameA-3370396b-8460-41d3-bb47-198ee84cc528_SOMETHING_CHANGED.txt",
                        oldValue:
                          "FileNameA-3370396b-8460-41d3-bb47-198ee84cc528.txt",
                        changeType: "updated",
                        changes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("Should detected an object with removed properties in the current data when these objects belongs to an array.", () => {
    // Arrange
    const current = {
      dependants: [
        {
          fullName: "My son 1",
          dateOfBirth: "2025-01-01",
        },
        {
          fullName: "My son 2",
        },
      ],
    };
    const previous = {
      dependants: [
        {
          fullName: "My son 1",
          dateOfBirth: "2025-01-01",
        },
        {
          fullName: "My son 2",
          dateOfBirth: "2025-01-02",
        },
      ],
    };

    // Act
    const result = compareApplicationData(current, previous);

    // Assert
    expect(result).toEqual([
      {
        key: "dependants",
        changeType: "updated",
        changes: [
          {
            index: 1,
            changeType: "propertiesRemoved",
            changes: [],
          },
        ],
      },
    ]);
  });
});
