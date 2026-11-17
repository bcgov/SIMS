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
    {
      description: "has all the required information",
      userToken: VALID_USER_TOKEN,
      expectedResult: false,
    },
    {
      description: "is missing the user's email",
      userToken: { ...VALID_USER_TOKEN, email: undefined },
      expectedResult: false,
    },
    {
      description: "is missing the user's last name",
      userToken: { ...VALID_USER_TOKEN, lastName: undefined },
      expectedResult: true,
    },
    {
      description: "has an empty user's last name",
      userToken: { ...VALID_USER_TOKEN, lastName: "   " },
      expectedResult: true,
    },
    {
      description: "is missing the user's date of birth",
      userToken: { ...VALID_USER_TOKEN, birthdate: undefined },
      expectedResult: true,
    },
    {
      description: "has an empty user's date of birth",
      userToken: { ...VALID_USER_TOKEN, birthdate: "   " },
      expectedResult: true,
    },
  ])(
    "Should return $expectedResult when the user token $description.",
    ({ userToken, expectedResult }) => {
      // Act
      const result = isUserTokenMissingRequiredInfo(userToken);
      // Assert
      expect(result).toBe(expectedResult);
    },
  );
});
