import { createMock } from "@golevelup/ts-jest";
import { SshService } from "@sims/integrations/services";
import { DisbursementValueType, RelationshipStatus } from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import {
  getGenderCode,
  getMaritalStatusCode,
  getPPDFlag,
} from "@sims/utilities/esdc-utils";
import { ECertFullTimeFileFooter } from "../../e-cert-files/e-cert-file-footer";
import { ECertFullTimeFileHeader } from "../../e-cert-files/e-cert-file-header";
import { ECertFullTimeIntegrationService } from "../../e-cert-full-time.integration.service";
import { RecordTypeCodes } from "../../../models/e-cert-integration-model";

describe("ECertFullTimeIntegrationService-createRequestContent", () => {
  let eCertFullTimeIntegrationService: ECertFullTimeIntegrationService;
  let configService: ConfigService;
  let sshService: SshService;

  beforeAll(() => {
    configService = createMock<ConfigService>();
    sshService = createMock<SshService>();
    const eCertFullTimeFileHeader = new ECertFullTimeFileHeader();
    const eCertFullTimeFileFooter = new ECertFullTimeFileFooter();
    eCertFullTimeIntegrationService = new ECertFullTimeIntegrationService(
      eCertFullTimeFileHeader,
      eCertFullTimeFileFooter,
      configService,
      sshService,
    );
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should create content for full time E-CERT file when requested providing E-CERT records.", async () => {
    // Arrange
    const ecertRecords = [
      {
        sin: "445966120",
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
        completionYears: "3YearsToLessThan4Years",
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
        calculatedPDPPDStatus: true,
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
    const fileLines = eCertFullTimeIntegrationService.createRequestContent(
      ecertRecords,
      1,
    );

    // Assert
    const [ecertRecord] = ecertRecords;
    expect(fileLines).toEqual([
      {
        processDate: expect.any(Date),
        recordTypeCode: RecordTypeCodes.ECertFullTimeHeader,
        sequence: 1,
      },
      {
        addressLine1: ecertRecord.addressLine1,
        addressLine2: ecertRecord.addressLine2,
        applicationNumber: ecertRecord.applicationNumber,
        bcslAwardAmount: 0,
        city: ecertRecord.city,
        country: ecertRecord.country,
        cslAwardAmount: 6554,
        dateOfBirth: ecertRecord.dateOfBirth,
        disbursementAmount: 10463,
        disbursementDate: ecertRecord.disbursementDate,
        documentNumber: ecertRecord.documentNumber,
        documentProducedDate: ecertRecord.documentProducedDate,
        educationalEndDate: ecertRecord.educationalEndDate,
        educationalStartDate: ecertRecord.educationalStartDate,
        emailAddress: ecertRecord.email,
        enrollmentConfirmationDate: ecertRecord.enrollmentConfirmationDate,
        federalInstitutionCode: ecertRecord.federalInstitutionCode,
        fieldOfStudy: ecertRecord.fieldOfStudy,
        firstName: ecertRecord.firstName,
        gender: getGenderCode(ecertRecord.gender),
        grantAwards: [
          {
            effectiveAmount: 999,
            valueAmount: 999,
            valueCode: "CSGP",
            valueType: "Canada Grant",
          },
          {
            effectiveAmount: 1800,
            valueAmount: 1800,
            valueCode: "CSPT",
            valueType: "Canada Grant",
          },
          {
            effectiveAmount: 777,
            valueAmount: 777,
            valueCode: "CSGD",
            valueType: "Canada Grant",
          },
          {
            effectiveAmount: 333,
            valueAmount: 333,
            valueCode: "BCSG",
            valueType: "BC Total Grant",
          },
        ],
        lastName: ecertRecord.lastName,
        maritalStatus: getMaritalStatusCode(ecertRecord.maritalStatus),
        negotiatedExpiryDate: ecertRecord.negotiatedExpiryDate,
        postalCode: "V1V 1V1",
        ppdFlag: getPPDFlag(ecertRecord.calculatedPDPPDStatus),
        provinceState: ecertRecord.provinceState,
        recordType: RecordTypeCodes.ECertFullTimeRecord,
        schoolAmount: 0,
        sin: ecertRecord.sin,
        studentAmount: 1046300,
        studentNumber: "",
        totalGrantAmount: 3909,
        totalYearsOfStudy: 4,
        weeksOfStudy: 51,
        yearOfStudy: 1,
      },
      {
        recordCount: 1,
        recordTypeCode: RecordTypeCodes.ECertFullTimeFooter,
        totalSINHash: 445966120,
      },
    ]);

    for (const line of fileLines) {
      expect(line.getFixedFormat().length).toBe(800);
    }
  });
});
