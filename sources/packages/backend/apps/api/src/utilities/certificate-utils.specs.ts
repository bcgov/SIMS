import { convertStringToPEM } from "@sims/auth/utilities";

// Target module

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
    expect(convertStringToPEM(text)).toThrow(
      "publicKey parameter was not provided",
    );
  });
});
