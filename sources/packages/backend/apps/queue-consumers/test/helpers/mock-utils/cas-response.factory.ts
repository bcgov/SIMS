import {
  formatAddress,
  formatCity,
  formatPostalCode,
} from "@sims/integrations/cas";
import {
  CASSupplierResponse,
  CreateExistingSupplierSiteResponse,
  CreateSupplierAddressSubmittedData,
  CreateSupplierAndSiteResponse,
  SendPendingInvoicesResponse,
} from "@sims/integrations/cas/models/cas-service.model";
import { CASSupplierRecordStatus, SupplierAddress } from "@sims/sims-db";
import * as faker from "faker";

/**
 * Creates a fake CAS supplier response.
 * @param options options.
 * - `initialValues` fake CAS supplier response values.
 * @returns a fake CAS supplier response.
 */
export function createFakeCASSupplierResponse(options?: {
  initialValues: {
    siteStatus?: CASSupplierRecordStatus;
    postalCode?: string;
    supplierNumber?: string;
    supplierName?: string;
    status?: CASSupplierRecordStatus;
    supplierProtected?: "Y" | "N" | null;
  };
}): CASSupplierResponse {
  return {
    items: [
      {
        suppliernumber: options?.initialValues?.supplierNumber ?? "2006124",
        suppliername: options?.initialValues?.supplierName ?? "SMITH, MELANIE",
        subcategory: "INDIVIDUAL",
        sin: "000000000",
        providerid: "CAS_WS_AE_PSFS_SIMS",
        businessnumber: null,
        status: options?.initialValues?.status ?? "ACTIVE",
        supplierprotected: options?.initialValues?.supplierProtected ?? null,
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
            postalcode: options?.initialValues?.postalCode ?? "V8Z7X9",
            emailaddress: null,
            accountnumber: null,
            branchnumber: null,
            banknumber: null,
            eftadvicepref: null,
            providerid: "CAS_WS_AE_PSFS_SIMS",
            status: options?.initialValues?.siteStatus ?? "ACTIVE",
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

export function createFakePendingInvoicesResponse(): SendPendingInvoicesResponse {
  return {
    invoiceNumber: "1234567",
  };
}

/**
 * Create a fake CreateSupplierAndSite response.
 * @param options options.
 * - `initialValues` fake CAS create supplier and site response values.
 * @returns fake CreateSupplierAndSite response.
 */
export function createFakeCASCreateSupplierAndSiteResponse(options?: {
  initialValues: {
    supplierAddress: SupplierAddress;
  };
}): CreateSupplierAndSiteResponse {
  const supplierAddress = createFakeCASSupplierAddress(
    options?.initialValues?.supplierAddress,
  );
  return {
    submittedData: {
      SupplierName: "DOE, JOHN",
      SubCategory: "Individual",
      Sin: faker.datatype.number({ min: 100000000, max: 999999999 }).toString(),
      SupplierAddress: [supplierAddress],
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
 * @param options options.
 * - `initialValues` fake CAS create supplier without site response values.
 * @returns fake CreateSupplierNoSite response.
 */
export function createFakeCASSiteForExistingSupplierResponse(options?: {
  initialValues: {
    supplierNumber: string;
    supplierAddress: SupplierAddress;
  };
}): CreateExistingSupplierSiteResponse {
  const supplierNumber =
    options?.initialValues?.supplierNumber ??
    faker.datatype.number({ min: 1000000, max: 9999999 }).toString();
  const supplierAddress = createFakeCASSupplierAddress(
    options?.initialValues?.supplierAddress,
  );
  return {
    submittedData: {
      SupplierNumber: supplierNumber,
      SupplierAddress: [supplierAddress],
    },
    response: {
      supplierNumber: supplierNumber,
      supplierSiteCode: "001",
    },
  };
}

export function createFakeCASSupplierAddress(
  supplierAddress?: SupplierAddress,
): CreateSupplierAddressSubmittedData {
  return {
    AddressLine1: supplierAddress?.addressLine1
      ? formatAddress(supplierAddress?.addressLine1)
      : faker.address.streetAddress(false).toUpperCase(),
    City: supplierAddress?.city
      ? formatCity(supplierAddress?.city)
      : "Victoria",
    Province: supplierAddress?.provinceState ?? "BC",
    Country: supplierAddress?.country ?? "CA",
    PostalCode: supplierAddress?.postalCode
      ? formatPostalCode(supplierAddress?.postalCode)
      : "H1H1H1",
    EmailAddress: faker.internet.email(),
  };
}
