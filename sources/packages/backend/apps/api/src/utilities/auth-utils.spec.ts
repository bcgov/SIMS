// Target module
import { extractRawUserName, getUserFullName } from "./auth-utils";

describe("Extract user real user name when Keycloak changed it (e.g. realUserName@bceid)", () => {
  it("Should extract the real user name when the user name has a @bceid appended", () => {
    // Arrange
    const userName = "someUserName@bceid";
    // Act
    const result = extractRawUserName(userName);
    // Assert
    expect(result).toBe("someUserName");
  });

  it("Should return the same user name if the string does not contains the @ symbol", () => {
    // Arrange
    const userName = "someUserName";
    // Act
    const result = extractRawUserName(userName);
    // Assert
    expect(result).toBe("someUserName");
  });

  it("Should return the proper user name for mononymous names when firstName is null", () => {
    // Arrange
    const firstName = null;
    const lastName = "Doe";
    // Act
    const result = getUserFullName({ firstName, lastName });
    // Assert
    expect(result).toBe("Doe");
  });

  it("Should return the proper user name for mononymous names when lastName is null", () => {
    // Arrange
    const firstName = "John";
    const lastName = null;
    // Act
    const result = getUserFullName({ firstName, lastName });
    // Assert
    expect(result).toBe("John");
  });

  it("Should return the proper user name when firstName and lastName are provided", () => {
    // Arrange
    const firstName = " John ";
    const lastName = " Doe ";
    // Act
    const result = getUserFullName({ firstName, lastName });
    // Assert
    expect(result).toBe("John Doe");
  });

  it("Should return the an empty user name when firstName and lastName are null", () => {
    // Arrange
    const firstName = null;
    const lastName = null;
    // Act
    const result = getUserFullName({ firstName, lastName });
    // Assert
    expect(result).toBe("");
  });
});
