// Target module
import { extractRawUserName } from "./auth-utils";

describe("Extract user real user name when Keycloak changed it (e.g. realUserName@bceid)", () => {
  it("Should extract the realuser name when the user name has a @bceid appended", () => {
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
});
