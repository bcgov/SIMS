import { TransactionCodes } from "../cra-integration.models";
import { CRAFileFooter } from "./cra-file-footer";
import { CRAFileHeader } from "./cra-file-header";
import { CRAFileIVRequestRecord } from "./cra-file-request-record";

describe("CRA Integration", () => {
  describe("Matching Run Request", () => {
    it("should create fixed format header", () => {
      // Arrange
      const header = new CRAFileHeader();
      header.transactionCode = TransactionCodes.MatchingRunHeader;
      header.processDate = new Date(2020, 11, 31);
      header.programAreaCode = "ABCD";
      header.environmentCode = "A";
      header.sequence = 1;
      // Act
      const fixedFormatHeader = header.getFixedFormat();
      // Assert
      expect(fixedFormatHeader).toBe(
        "7000                        20201231 ABCDA00001                                                                                                   0",
      );
    });

    it("should create fixed format IV Request Record (0020)", () => {
      // Arrange
      const record = new CRAFileIVRequestRecord();
      record.transactionCode = TransactionCodes.MatchingRunRecord;
      record.sin = "123456789";
      record.individualSurname = "Doe";
      record.individualGivenName = "John";
      record.individualBirthDate = new Date(1980, 0, 31);

      record.programAreaCode = "ABCD";
      // Act
      const fixedFormatHeader = record.getFixedFormat();
      // Assert
      expect(fixedFormatHeader).toBe(
        "7001123456789    0020Doe                           John                          19800131                    ABCD                                 0",
      );
    });

    it("should create fixed format footer", () => {
      // Arrange
      const footer = new CRAFileFooter();
      footer.transactionCode = TransactionCodes.MatchingRunFooter;
      footer.processDate = new Date(2020, 11, 31);
      footer.programAreaCode = "ABCD";
      footer.environmentCode = "A";
      footer.sequence = 1;
      footer.recordCount = 5;
      // Act
      const fixedFormatHeader = footer.getFixedFormat();
      // Assert
      expect(fixedFormatHeader).toBe(
        "7002                        20201231 ABCDA00001      00000005                                                                                     0",
      );
    });
  });
});
