import { CASService } from "@sims/integrations/cas/cas.service";
import { createFakeCASSupplierResponse } from "./cas-response.factory";

export const CAS_LOGON_MOCKED_RESULT = {
  access_token: "token123",
  token_type: "123456789",
  expires_in: 3600,
};

export const SUPPLIER_INFO_FROM_CAS_MOCKED_RESULT =
  createFakeCASSupplierResponse();

/**
 * Creates a CAS service mock.
 * @returns a CAS service mock.
 */
export function createCASServiceMock(): CASService {
  const mockedCASService = {} as CASService;
  mockedCASService.logon = jest.fn(() =>
    Promise.resolve(CAS_LOGON_MOCKED_RESULT),
  );

  mockedCASService.getSupplierInfoFromCAS = jest.fn(() =>
    Promise.resolve(SUPPLIER_INFO_FROM_CAS_MOCKED_RESULT),
  );

  return mockedCASService;
}
