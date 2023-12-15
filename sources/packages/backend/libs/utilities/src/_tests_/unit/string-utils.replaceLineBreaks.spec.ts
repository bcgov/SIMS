import { replaceLineBreaks } from "@sims/utilities/string-utils";

describe("StringUtils-replaceLineBreaks", () => {
  it("Should replace the line break with empty string value in given text when one or more line break character is present.", () => {
    //Arrange
    const textWithLineBreaks = "Some program with\n description\r\n too long";

    // Act
    const sanitizedData = replaceLineBreaks(textWithLineBreaks);

    // Assert
    const expectedSanitizedData = "Some program with description too long";
    expect(sanitizedData).toBe(expectedSanitizedData);
  });

  it("Should replace the line break with given value in given text when one or more line break character is present.", () => {
    //Arrange
    const textWithLineBreaks = "Some program with\ndescription\r\ntoo long";

    // Act
    const sanitizedData = replaceLineBreaks(textWithLineBreaks, {
      replaceText: " ",
    });

    // Assert
    const expectedSanitizedData = "Some program with description too long";
    expect(sanitizedData).toBe(expectedSanitizedData);
  });

  it("Should return the value as is when the given text is undefined.", () => {
    // Act
    const sanitizedData = replaceLineBreaks();

    // Assert
    expect(sanitizedData).not.toBeDefined();
  });
});
