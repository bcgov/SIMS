// Target module
import {
  extractRawUserName,
  getUserFullName,
  isUserTokenMissingRequiredInfo,
} from "./auth-utils";
import { IUserToken } from "../auth/userToken.interface";

const VALID_USER_TOKEN = {
  email: "some.email@some.domain.com",
  lastName: "Doe",
  birthdate: "2000-01-01",
} as IUserToken;

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

describe("Validation of user token required information", () => {
  it("Should return false when the user token has all the required information.", () => {
    // Act
    const result = isUserTokenMissingRequiredInfo(VALID_USER_TOKEN);
    // Assert
    expect(result).toBe(false);
  });

  it.each([
    ["email", { ...VALID_USER_TOKEN, email: undefined }],
    ["email", { ...VALID_USER_TOKEN, email: "   " }],
    ["last name", { ...VALID_USER_TOKEN, lastName: undefined }],
    ["last name", { ...VALID_USER_TOKEN, lastName: "   " }],
    ["date of birth", { ...VALID_USER_TOKEN, birthdate: undefined }],
    ["date of birth", { ...VALID_USER_TOKEN, birthdate: "   " }],
  ])(
    "Should return true when the user token is missing the user's %s.",
    (_: string, userToken: IUserToken) => {
      // Act
      const result = isUserTokenMissingRequiredInfo(userToken);
      // Assert
      expect(result).toBe(true);
    },
  );
});
