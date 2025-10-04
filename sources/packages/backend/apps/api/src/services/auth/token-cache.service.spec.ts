import * as dayjs from "dayjs";
import {
  TokenCacheService,
  TOKEN_RENEWAL_SECONDS,
} from "./token-cache.service";
import { TokenCacheResponse } from "./token-cache.service.models";

describe("TokenCacheService", () => {
  it("Should acquire a new token when the cache is empty", async () => {
    // Arrange
    let tokenAcquireMethodInvoked = false;
    const tokenResponse: TokenCacheResponse = {
      accessToken: "faked",
      expiresIn: 12345,
    };
    const tokenAcquireMethod = () => {
      tokenAcquireMethodInvoked = true;
      return Promise.resolve(tokenResponse);
    };
    const tokenCacheService = new TokenCacheService(
      "test cache",
      tokenAcquireMethod,
    );
    // Act
    await tokenCacheService.getToken();
    // Assert
    expect(tokenAcquireMethodInvoked).toBe(true);
  });

  it("Should reuse a token when the cache is present and valid", async () => {
    // Forces the expiration date to be beyond the minimun accepted.
    const secondsToAdd = TOKEN_RENEWAL_SECONDS * 2;
    const expectedTokenCreation = 1;
    await testTokenExpiration(secondsToAdd, expectedTokenCreation);
  });

  it("Should create a new token when the cache is present but invalid", async () => {
    // Forces the expiration date to be invalid.
    const secondsToAdd = 0;
    const expectedTokenCreation = 2;
    await testTokenExpiration(secondsToAdd, expectedTokenCreation);
  });
});

/**
 * Executes the getToken twice allowing to inspect if the
 * second call will create or reuse the cache.
 * @param secondsToAdd seconds to be added to the current time.
 * @param expectedTokenCreation number of times that the token should be acquired.
 */
async function testTokenExpiration(
  secondsToAdd: number,
  expectedTokenCreation: number,
) {
  // Arrange
  let tokenAcquireMethodInvokedCount = 0;
  const tokenResponse: TokenCacheResponse = {
    accessToken: "faked",
    expiresIn:
      dayjs(new Date()).add(secondsToAdd, "second").toDate().getTime() / 1000,
  };
  const tokenAcquireMethod = () => {
    tokenAcquireMethodInvokedCount++;
    return Promise.resolve(tokenResponse);
  };
  const tokenCacheService = new TokenCacheService(
    "test cache",
    tokenAcquireMethod,
  );
  // Act
  await tokenCacheService.getToken(); // Create the token.
  await tokenCacheService.getToken(); // Reuse the token.
  // Assert
  expect(tokenAcquireMethodInvokedCount).toBe(expectedTokenCreation);
}
