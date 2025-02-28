import { CASService, PendingInvoicePayload } from "@sims/integrations/cas";
import { Mocked } from "@suites/unit";
import { HttpService } from "@nestjs/axios";
import {
  DEFAULT_CAS_AXIOS_AUTH_HEADER,
  initializeService,
  mockAuthenticationResponseOnce,
} from "./cas-test.utils";
import { CAS_BAD_REQUEST } from "@sims/integrations/constants";
import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";

describe("CASService-sendPendingInvoices", () => {
  let casService: CASService;
  let httpService: Mocked<HttpService>;

  beforeAll(async () => {
    [casService, httpService] = await initializeService();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Should invoke CAS API to send pending invoices when all data was provided as expected in the payload.", async () => {
    // Arrange
    mockAuthenticationResponseOnce(httpService).mockResolvedValue({
      data: {
        invoice_number: "1234567",
        "CAS-Returned-Messages": "SUCCEEDED",
      },
    });
    const pendingInvoicesPayload = {
      invoiceType: "Standard",
      supplierNumber: "DUMMY_SUPPLIER_NUMBER",
      supplierSiteNumber: "DUMMY_SUPPLIER_SITE_NUMBER",
      invoiceDate: "21-FEB-2025",
      invoiceNumber: "DUMMY_INVOICE_NUMBER",
      invoiceAmount: 0,
      payGroup: "GEN GLP",
      dateInvoiceReceived: "21-FEB-2025",
      remittanceCode: "01",
      specialHandling: "N",
      terms: "Immediate",
      remittanceMessage1: "",
      remittanceMessage2: "",
      glDate: "21-FEB-2025",
      invoiceBatchName: "Dummy invoice batch name",
      currencyCode: "CAD",
      invoiceLineDetails: [
        {
          invoiceLineNumber: 1,
          invoiceLineType: "Item",
          lineCode: "DUMMY_LINE_CODE",
          invoiceLineAmount: 0,
          defaultDistributionAccount: "DUMMY_DEFAULT_DISTRIBUTION_ACCOUNT",
        },
      ],
    };
    // Act
    await casService.sendInvoice(pendingInvoicesPayload);
    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      "cas-url/cfs/apinvoice/",
      pendingInvoicesPayload,
      DEFAULT_CAS_AXIOS_AUTH_HEADER,
    );
  });

  it("Should throw error when CAS API to send pending invoice with pending payload data was provided and some CAS validation failed.", async () => {
    // Arrange
    mockAuthenticationResponseOnce(httpService).mockResolvedValue({
      data: {
        invoice_number: "1234567",
        "CAS-Returned-Messages": "SUCCEEDED",
      },
    });
    const pendingInvoicesPayload = {} as PendingInvoicePayload;
    //Act
    httpService.axiosRef.post = jest.fn().mockImplementationOnce(() => {
      const error = new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        {
          headers: new AxiosHeaders(),
        },
        {},
        {
          status: HttpStatusCode.BadRequest,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {
            "CAS-Returned-Messages":
              "[036] GL Date is blank, not in an open period or formatted incorrectly.",
          },
        },
      );
      throw error;
    });

    //Assert
    await expect(
      casService.sendInvoice(pendingInvoicesPayload),
    ).rejects.toThrow(
      expect.objectContaining({
        message: "CAS Bad Request Errors",
        name: CAS_BAD_REQUEST,
        objectInfo: [
          "[036] GL Date is blank, not in an open period or formatted incorrectly.",
        ],
      }),
    );
  });
});
