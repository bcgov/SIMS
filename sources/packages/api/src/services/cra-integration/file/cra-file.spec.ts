import { CraFileHeader } from "./cra-file-header";

describe("CRA Integration - Footer Validation", () => {
  it("should create fixed format header", () => {
    // Arrange
    const header = {
      processDate: new Date(2020, 11, 31),
      programAreaCode: "ABCD",
      environmentCode: "A",
      sequence: 1,
    } as CraFileHeader;
    // Act
    const fixedFormatHeader = header.getFixedFormat();
    // Assert
    expect(fixedFormatHeader).toBe(
      "7000                        20201231 ABCDA             1                                                                                     0",
    );
  });
});
