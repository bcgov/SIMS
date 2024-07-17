import { CASSupplierResponse } from "@sims/integrations/cas/models/cas-supplier-response.model";

/**
 * Creates a fake CAS supplier response.
 * @returns a fake CAS supplier response.
 */
export function createFakeCASSupplierResponse(): CASSupplierResponse {
  return {
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
}
