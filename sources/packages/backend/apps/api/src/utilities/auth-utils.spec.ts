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
  it.each([
    ["has all the required information", VALID_USER_TOKEN, false],
    [
      "is missing the user's email",
      { ...VALID_USER_TOKEN, email: undefined },
      false,
    ],
    [
      "is missing the user's last name",
      { ...VALID_USER_TOKEN, lastName: undefined },
      true,
    ],
    [
      "has an empty user's last name",
      { ...VALID_USER_TOKEN, lastName: "   " },
      true,
    ],
    [
      "is missing the user's date of birth",
      { ...VALID_USER_TOKEN, birthdate: undefined },
      true,
    ],
    [
      "has an empty user's date of birth",
      { ...VALID_USER_TOKEN, birthdate: "   " },
      true,
    ],
  ])(
    "Should return the expected result when the user token %s.",
    (_: string, userToken: IUserToken, expectedResult: boolean) => {
      // Act
      const result = isUserTokenMissingRequiredInfo(userToken);
      // Assert
      expect(result).toBe(expectedResult);
    },
  );
});
