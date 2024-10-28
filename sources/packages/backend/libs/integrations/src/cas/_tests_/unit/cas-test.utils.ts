import { HttpService } from "@nestjs/axios";
import { CASService } from "@sims/integrations/cas";
import { ConfigService } from "@sims/utilities/config";
import { Mocked } from "@suites/doubles.jest";
import { TestBed } from "@suites/unit";

/**
 * Default access token used for authentication.
 */
const ACCESS_TOKEN = "access_token";

/**
 * Default axios headers for authentication.
 */
export const DEFAULT_CAS_AXIOS_AUTH_HEADER = {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
};

/**
 * Mock the first post call for authentication.
 * @param httpServiceMock mocked for HTTP service.
 * @returns mocked axios response.
 */
export function mockAuthenticationResponseOnce(
  httpServiceMock: Mocked<HttpService>,
): jest.Mock {
  const httpMethodMock = httpServiceMock.axiosRef.post as jest.Mock;
  return httpMethodMock.mockResolvedValueOnce({
    data: {
      access_token: ACCESS_TOKEN,
      token_type: "bearer",
      expires_in: 3600,
    },
  });
}

/**
 * Initializes the service under test.
 * @returns array of mocked services.
 */
export async function initializeService(): Promise<
  [
    casService: CASService,
    httpService: Mocked<HttpService>,
    configService: Mocked<ConfigService>,
  ]
> {
  const { unit, unitRef } = await TestBed.solitary(CASService).compile();
  const configService = unitRef.get(ConfigService);
  const httpService = unitRef.get(HttpService);
  configService.casIntegration.baseUrl = "cas-url";
  return [unit, httpService, configService];
}
