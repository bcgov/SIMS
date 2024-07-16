import { CASService } from "@sims/integrations/cas/cas.service";

export const CAS_LOGON_MOCKED_RESULT = {
  access_token: "token123",
  token_type: "123456789",
  expires_in: 3600,
};

export const SUPPLIER_INFO_FROM_CAS_MOCKED_RESULT = {
  items: [
    {
      suppliernumber: "2006124",
      suppliername: "SMITH, MELANIE",
      subcategory: "INDIVIDUAL",
      sin: "000000000",
      providerid: "CAS_WS_AE_PSFS_SIMS",
      businessnumber: null,
      status: "ACTIVE",
      supplierprotected: null,
      standardindustryclassification: null,
      lastupdated: "2024-05-01 13:55:00",
      supplieraddress: [
        {
          suppliersitecode: "001",
          addressline1: "3350 DOUGLAS ST",
          addressline2: null,
          addressline3: null,
          city: "VICTORIA",
          province: "BC",
          country: "CA",
          postalcode: "V8Z7X9",
          emailaddress: null,
          accountnumber: null,
          branchnumber: null,
          banknumber: null,
          eftadvicepref: null,
          providerid: "CAS_WS_AE_PSFS_SIMS",
          status: "ACTIVE",
          siteprotected: null,
          lastupdated: "2024-05-01 13:55:04",
        },
      ],
    },
  ],
  hasMore: false,
  limit: 0,
  offset: 0,
  count: 1,
};

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
