import {
  CASSupplierResponse,
  CreateSupplierAndSiteResponse,
} from "@sims/integrations/cas/models/cas-service.model";
import { SupplierAddress } from "@sims/sims-db";
import * as faker from "faker";

/**
 * Creates a fake CAS supplier response.
 * @returns a fake CAS supplier response.
 */
export function createFakeCASSupplierResponse(options?: {
  initialValues: {
    supplierNumber: string;
    addressLine1: string;
    postalCode: string;
  };
}): CASSupplierResponse {
  return {
    items: [
      {
        suppliernumber: options?.initialValues?.supplierNumber ?? "2006124",
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
            addressline1:
              options?.initialValues?.addressLine1 ?? "3350 DOUGLAS ST",
            addressline2: null,
            addressline3: null,
            city: "VICTORIA",
            province: "BC",
            country: "CA",
            postalcode: options?.initialValues?.postalCode ?? "V8Z7X9",
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

/**
 * Creates a empty fake CAS supplier response.
 * @returns empty CAS supplier response.
 */
export function createFakeCASNotFoundSupplierResponse(): CASSupplierResponse {
  return {
    items: [],
    hasMore: false,
    limit: 0,
    offset: 0,
    count: 0,
  };
}

/**
 * Create a fake CreateSupplierAndSite response.
 * @returns fake CreateSupplierAndSite response.
 */
export function createFakeCASCreateSupplierAndSiteResponse(): CreateSupplierAndSiteResponse {
  return {
    submittedData: {
      SupplierName: "DOE, JOHN",
      SubCategory: "Individual",
      Sin: faker.datatype.number({ min: 100000000, max: 999999999 }).toString(),
      SupplierAddress: [
        {
          AddressLine1: faker.address.streetAddress(false).toUpperCase(),
          City: "Victoria",
          Province: "BC",
          Country: "CA",
          PostalCode: "H1H1H1",
          EmailAddress: faker.internet.email(),
        },
      ],
    },
    response: {
      supplierNumber: faker.datatype
        .number({ min: 1000000, max: 9999999 })
        .toString(),
      supplierSiteCode: "001",
    },
  };
}

/**
 * Create a fake CreateSupplierNoSite response with missing postal code.
 * @returns fake CreateSupplierNoSite response.
 */
export function createFakeCASCreateSupplierNoSiteResponse(options?: {
  initialValues: {
    supplierNumber: string;
    supplierAddress: SupplierAddress;
  };
}): CreateSupplierAndSiteResponse {
  const supplierNumber =
    options?.initialValues?.supplierNumber ??
    faker.datatype.number({ min: 1000000, max: 9999999 }).toString();
  return {
    submittedData: {
      SupplierNumber: supplierNumber,
      SupplierAddress: [
        {
          AddressLine1:
            options?.initialValues?.supplierAddress.addressLine1 ??
            faker.address.streetAddress(false).toUpperCase(),
          AddressLine2: "",
          AddressLine3: "",
          City: options?.initialValues?.supplierAddress.city ?? "Victoria",
          Province:
            options?.initialValues?.supplierAddress.provinceState ?? "BC",
          Country: options?.initialValues?.supplierAddress.country ?? "CA",
          PostalCode:
            options?.initialValues?.supplierAddress.postalCode ?? "H1H1H1",
          EmailAddress: faker.internet.email(),
        },
      ],
    },
    response: {
      supplierNumber: supplierNumber,
      supplierSiteCode:
        options?.initialValues?.supplierAddress.supplierSiteCode ?? "001",
    },
  };
}
