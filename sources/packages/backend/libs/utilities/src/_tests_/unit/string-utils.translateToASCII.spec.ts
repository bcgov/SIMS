import {
  CARRIAGE_RETURN,
  convertToASCIIString,
  LINE_FEED,
  NON_PRINTABLE_CHARACTERS_LIMIT,
  UNEXPECTED_CHAR,
} from "@sims/utilities/string-utils";

describe("StringUtils-convertToASCII", () => {
  it("Should replace the special characters when equivalent ones are present.", () => {
    // Arrange
    const textWithSpecialCharacters =
      "Some text with special characters: ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ—àáâãäåçèéêëìíîï-ñóòôõöùúûüýÿ";

    // Act
    const translatedData = convertToASCIIString(textWithSpecialCharacters);

    // Assert
    expect(translatedData).toBe(
      "Some text with special characters: AAAAAACEEEEIIIINOOOOOUUUU-aaaaaaceeeeiiii-nooooouuuuyy",
    );
  });

  it("Should return null when null is provided.", () => {
    // Arrange
    const textWithSpecialCharacters = null;

    // Act
    const translatedData = convertToASCIIString(textWithSpecialCharacters);

    // Assert
    expect(translatedData).toBeNull();
  });

  it("Should return null when undefined is provided.", () => {
    // Arrange
    const textWithSpecialCharacters = undefined;

    // Act
    const translatedData = convertToASCIIString(textWithSpecialCharacters);

    // Assert
    expect(translatedData).toBeNull();
  });

  it("Should replace ASCII control characters (0-31) with '?' when they are not line feed or carriage return.", () => {
    // Arrange
    let controlChars = "";
    for (let i = 0; i <= NON_PRINTABLE_CHARACTERS_LIMIT; i++) {
      if (i !== LINE_FEED && i !== CARRIAGE_RETURN) {
        // Exclude line feed (LF) and carriage return (CR) characters.
        controlChars += String.fromCharCode(i);
      }
    }

    // Act
    const translatedData = convertToASCIIString(controlChars);

    // Assert
    expect(translatedData).toBe(
      String.fromCharCode(UNEXPECTED_CHAR).repeat(controlChars.length),
    );
  });
});
