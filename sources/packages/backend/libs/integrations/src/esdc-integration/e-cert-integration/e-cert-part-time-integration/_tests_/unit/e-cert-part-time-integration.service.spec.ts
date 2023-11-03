import { createMock } from "@golevelup/ts-jest";
import { SshService } from "@sims/integrations/services";
import { DisbursementValueType, RelationshipStatus } from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { ECertPartTimeFileFooter } from "../../e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileHeader } from "../../e-cert-files/e-cert-file-header";
import { ECertPartTimeIntegrationService } from "../../e-cert-part-time.integration.service";

describe("ECertPartTimeIntegrationService-createRequestContent", () => {
  let eCertPartTimeIntegrationService: ECertPartTimeIntegrationService;
  let eCertPartTimeFileHeader: ECertPartTimeFileHeader;
  let eCertPartTimeFileFooter: ECertPartTimeFileFooter;
  let configService: ConfigService;
  let sshService: SshService;

  beforeAll(() => {
    configService = createMock<ConfigService>();
    sshService = createMock<SshService>();
    eCertPartTimeFileHeader = new ECertPartTimeFileHeader();
    eCertPartTimeFileFooter = new ECertPartTimeFileFooter();
    eCertPartTimeIntegrationService = new ECertPartTimeIntegrationService(
      eCertPartTimeFileHeader,
      eCertPartTimeFileFooter,
      configService,
      sshService,
    );
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it(`Should create content for part time E-CERT file when requested providing E-CERT records.`, async () => {
    // Arrange
    const ecertRecords = [
      {
        sin: "445966120",
        stopFullTimeBCFunding: false,
        courseLoad: 20,
        applicationNumber: "2023000009",
        documentNumber: 28,
        disbursementDate: new Date("2023-11-03T00:00:00.000Z"),
        documentProducedDate: new Date("2023-11-03T20:37:58.422Z"),
        negotiatedExpiryDate: new Date("2023-11-03T00:00:00.000Z"),
        schoolAmount: 0,
        educationalStartDate: new Date("2023-09-15T00:00:00.000Z"),
        educationalEndDate: new Date("2024-08-30T00:00:00.000Z"),
        federalInstitutionCode: "DDDD",
        weeksOfStudy: 51,
        fieldOfStudy: 15,
        yearOfStudy: 1,
        completionYears: "12WeeksToLessThan1Year",
        enrollmentConfirmationDate: new Date("2023-11-03T19:59:44.913Z"),
        dateOfBirth: new Date("1973-01-31T00:00:00.000Z"),
        lastName: "SHAH",
        firstName: "RAM DEV",
        addressLine1: "123 Gorge Rd E",
        addressLine2: "",
        city: "Victoria",
        country: "Canada",
        provinceState: "BC",
        postalCode: "V1V1V1",
        email: "simsthree@test.ca",
        gender: "male",
        ppdFlag: null,
        maritalStatus: RelationshipStatus.Other,
        studentNumber: "",
        awards: [
          {
            valueType: DisbursementValueType.CanadaLoan,
            valueCode: "CSLP",
            valueAmount: 6554,
            effectiveAmount: 6554,
          },
          {
            valueType: DisbursementValueType.CanadaGrant,
            valueCode: "CSGP",
            valueAmount: 999,
            effectiveAmount: 999,
          },
          {
            valueType: DisbursementValueType.CanadaGrant,
            valueCode: "CSPT",
            valueAmount: 1800,
            effectiveAmount: 1800,
          },
          {
            valueType: DisbursementValueType.CanadaGrant,
            valueCode: "CSGD",
            valueAmount: 777,
            effectiveAmount: 777,
          },
          {
            valueType: DisbursementValueType.BCTotalGrant,
            valueCode: "BCSG",
            valueAmount: 333,
            effectiveAmount: 333,
          },
        ],
      },
    ];
    // Act
    const fileLines = eCertPartTimeIntegrationService.createRequestContent(
      ecertRecords,
      1,
    );

    // Assert
    expect(fileLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordTypeCode: "01",
          sequence: 1,
        }),
        expect.objectContaining({
          recordType: "02",
          sin: "445966120",
          courseLoad: 20,
          certNumber: 28,
          disbursementDate: new Date("2023-11-03T00:00:00.000Z"),
          documentProducedDate: new Date("2023-11-03T20:37:58.422Z"),
          disbursementAmount: 6554,
          schoolAmount: 0,
          educationalStartDate: new Date("2023-09-15T00:00:00.000Z"),
          educationalEndDate: new Date("2024-08-30T00:00:00.000Z"),
          federalInstitutionCode: "DDDD",
          weeksOfStudy: 51,
          fieldOfStudy: 15,
          yearOfStudy: 1,
          enrollmentConfirmationDate: new Date("2023-11-03T19:59:44.913Z"),
          dateOfBirth: new Date("1973-01-31T00:00:00.000Z"),
          lastName: "SHAH",
          firstName: "RAM DEV",
          addressLine1: "123 Gorge Rd E",
          addressLine2: "",
          city: "Victoria",
          country: "CAN",
          provinceState: "BC",
          postalCode: "V1V1V1",
          emailAddress: "simsthree@test.ca",
          gender: "M",
          maritalStatus: "SP",
          studentNumber: "",
          ppdFlag: "N",
          totalCanadaGrantAmount: 3909,
          totalBCGrantAmount: 333,
          CSGPPTAmount: 1800,
          CSGPPDAmount: 999,
          CSGPPTDEPAmount: 777,
        }),
        expect.objectContaining({
          recordTypeCode: "99",
          totalAmountDisbursed: 6554,
          recordCount: 1,
        }),
      ]),
    );

    for (const line of fileLines) {
      expect(line.getFixedFormat().length).toBe(756);
    }
  });
});
