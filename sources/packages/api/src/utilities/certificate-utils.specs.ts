import * as fs from "fs";

// Target module
import { convertStringToPEM } from "./certificate-utils";

describe("Test string convertion to PEM format", () => {
  it("Should add header and footer when a text is provided", () => {
    // Arranged
    const text = "some plain text";
    // Act
    const result = convertStringToPEM(text);
    // Assert
    expect(result.length).toBe(
      "-----BEGIN PUBLIC KEY-----\nsome plain text\n-----END PUBLIC KEY-----",
    );
  });

  it("Should throw an exception when the text is not provided", () => {
    // Arranged
    const text: string = null;
    // Act/Assert
    expect(convertStringToPEM(text)).toThrowError(
      "publicKey parameter was not provided",
    );
  });
});
