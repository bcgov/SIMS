import { CASService } from "../../../src/services/cas-supplier/cas.service";

export const casLogonMockedResult = {
  access_token: "token123",
  token_type: "123456789",
  expires_in: 3600,
};

export const getSupplierInfoFromCASMockedResult = {
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
  links: [
    {
      rel: "self",
      href: "https://localhost:8080/ords/cas/cfs/supplier/SMITH/lastname/123456789/sin",
    },
    {
      rel: "describedby",
      href: "https://localhost:8080/ords/cas/metadata-catalog/cfs/supplier/SMITH/lastname/123456789/item",
    },
  ],
};

export function createCASServiceMock(): CASService {
  const mockedCASService = {} as CASService;
  mockedCASService.casLogon = jest.fn(() =>
    Promise.resolve(casLogonMockedResult),
  );

  mockedCASService.getSupplierInfoFromCAS = jest.fn(() =>
    Promise.resolve(getSupplierInfoFromCASMockedResult),
  );

  return mockedCASService;
}
