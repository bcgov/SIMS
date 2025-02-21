import { CASService } from "@sims/integrations/cas";
import { Mocked } from "@suites/unit";
import { HttpService } from "@nestjs/axios";
import {
  DEFAULT_CAS_AXIOS_AUTH_HEADER,
  initializeService,
  mockAuthenticationResponseOnce,
} from "./cas-test.utils";

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
    await casService.sendPendingInvoices(pendingInvoicesPayload);
    // Assert
    expect(httpService.axiosRef.post).toHaveBeenCalledWith(
      "cas-url/cfs/apinvoice/",
      pendingInvoicesPayload,
      DEFAULT_CAS_AXIOS_AUTH_HEADER,
    );
  });
});
