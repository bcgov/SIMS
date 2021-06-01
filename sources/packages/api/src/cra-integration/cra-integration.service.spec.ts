import { ConfigService } from "../services";
import { CRAIntegrationService } from "./cra-integration.service";
import * as faker from "faker";
import {
  CRAPersonRecord,
  MatchStatusCodes,
  RequestStatusCodes,
  TransactionCodes,
  TransactionSubCodes,
} from "./cra-integration.models";
import { CRAFileHeader } from "./cra-files/cra-file-header";
import { IConfig } from "../types/config";
import { CRAFileFooter } from "./cra-files/cra-file-footer";
import { CRAFileIVRequestRecord } from "./cra-files/cra-file-request-record";
import SshServiceMock from "./__mocks__/SShService";
import { CRAResponseFileLine } from "./cra-files/cra-file-response-record";

describe("CRAIntegrationService", () => {
  // Dependencies of the service being tested.
  const configServiceMock = new ConfigService();
  // Mock environment variables.
  const environmentCode = "A";
  const programAreaCode = "ABCD";
  jest.spyOn(configServiceMock, "getConfig").mockImplementation(() => {
    const config = {} as IConfig;
    config.zoneBsFTP = {
      host: "HOST",
      port: 22,
      username: "FTP_USER_NAME",
      passphrase: "FTP_PASSPHRASE",
      privateKey: "FTP_PRIVATE_KEY",
    };
    config.CRAIntegration = {
      ftpRequestFolder: "request-folder",
      ftpResponseFolder: "response-folder",
      programAreaCode: programAreaCode,
      environmentCode: environmentCode,
    };
    return config;
  });
  // Service to be tested.
  const service = new CRAIntegrationService(configServiceMock, SshServiceMock);

  it("should create matching run content for 2 random people", () => {
    // Arrange
    const peopleRecords: CRAPersonRecord[] = [
      {
        sin: faker.random.number({ min: 111111111, max: 999999999 }).toString(),
        surname: faker.name.lastName(),
        givenName: faker.name.firstName(),
        birthDate: faker.date.past(18),
        taxYear: faker.random.number({ min: 2000, max: 2030 }),
        freeProjectArea: faker.random.alpha({ count: 30 }),
      },
      {
        sin: faker.random.number({ min: 111111111, max: 999999999 }).toString(),
        surname: faker.name.lastName(),
        givenName: faker.name.firstName(),
        birthDate: faker.date.past(18),
        taxYear: faker.random.number({ min: 2000, max: 2030 }),
        freeProjectArea: faker.random.alpha({ count: 30 }),
      },
    ];
    const sequence = 1;

    // Act
    const recordsCreated = service.createMatchingRunContent(
      peopleRecords,
      sequence,
    );

    // Assert
    expect(recordsCreated.length).toBe(4); // 2 people + header + footer
    // Validate header
    const header = recordsCreated.shift() as CRAFileHeader;
    expect(header.transactionCode).toBe(TransactionCodes.MatchingRunHeader);
    expect(header.programAreaCode).toBe(programAreaCode);
    expect(header.environmentCode).toBe(environmentCode);
    expect(header.sequence).toBe(sequence);
    // Validate first record.
    const record = recordsCreated.shift() as CRAFileIVRequestRecord;
    const expectedRecord = peopleRecords[0];
    expect(record.transactionCode).toBe(TransactionCodes.MatchingRunRecord);
    expect(record.individualSurname).toBe(expectedRecord.surname);
    expect(record.individualGivenName).toBe(expectedRecord.givenName);
    expect(record.individualBirthDate).toBe(expectedRecord.birthDate);
    expect(record.programAreaCode).toBe(programAreaCode);
    expect(record.freeProjectArea).toBe(expectedRecord.freeProjectArea);
    expect(record.sin).toBe(expectedRecord.sin);
    // Validate footer.
    const footer = recordsCreated.pop() as CRAFileFooter;
    expect(footer.transactionCode).toBe(TransactionCodes.MatchingRunFooter);
    expect(footer.programAreaCode).toBe(programAreaCode);
    expect(footer.environmentCode).toBe(environmentCode);
    expect(footer.sequence).toBe(sequence);
  });

  it("should download and process CRA files using mocked files contents", async () => {
    // Act
    const sftpDownloadedFiles = await service.downloadResponseFiles();

    // Assert
    expect(sftpDownloadedFiles.length).toBe(2);
    // Sample file available at __mocks__\response-folder\CCRA_RESPONSE_ABCSL00001.TXT
    const firstFile = sftpDownloadedFiles.shift();
    expect(firstFile.records.length).toBe(2);
    // Validate basic record identification: Transaction Code/SIN/Transaction Sub Code.
    const firstRecord = firstFile.records.shift();
    expect(firstRecord.transactionCode).toBe(TransactionCodes.ResponseRecord);
    expect(firstRecord.sin).toBe("111111111");
    expect(firstRecord.transactionSubCode).toBe(
      TransactionSubCodes.ResponseRecord,
    );
    // Validate specific record info: SIN validation.
    const responseFileLine = firstRecord as CRAResponseFileLine;
    expect(responseFileLine.requestStatusCode).toBe(
      RequestStatusCodes.successfulRequest,
    );
    expect(responseFileLine.matchStatusCode).toBe(
      MatchStatusCodes.successfulMatch,
    );
    expect(responseFileLine.freeProjectArea).toBe("STUDENT_SIN_VALIDATION");
  });
});
