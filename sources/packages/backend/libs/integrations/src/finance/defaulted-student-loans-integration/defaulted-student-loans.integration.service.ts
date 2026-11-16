import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { LoggerService } from "@sims/utilities/logger";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import {
  BalanceTypeItem,
  DefaultedStudentLoanBalanceType,
  DefaultedStudentLoanInterestType,
  POPULATED_BALANCE_TYPES,
  TRANSMISSION_SOURCE_ID,
} from "./models/defaulted-student-loans-integration.model";
import { DefaultedStudentLoansFileHeader } from "./defaulted-student-loans-files/defaulted-student-loans-file-header";
import { DefaultedStudentLoansFileDetail } from "./defaulted-student-loans-files/defaulted-student-loans-file-detail";
import { DefaultedStudentLoansFileFooter } from "./defaulted-student-loans-files/defaulted-student-loans-file-footer";
import { IndividualReturnedLoan, ReturnedLoan } from "../../esdc-integration";
import { YNFlag } from "@sims/integrations/models";

@Injectable()
export class DefaultedStudentLoansIntegrationService extends SFTPIntegrationBase<void> {
  constructor(
    config: ConfigService,
    sshService: SshService,
    logger: LoggerService,
  ) {
    super(config.zoneBSFTP, sshService, logger);
  }

  /**
   * Creates the defaulted student loans file content from individual returned loans.
   * The file consists of a header record, detail records for each loan, and a footer record.
   * @param individualReturnedLoans array of individual returned loans to process.
   * @param transmissionNumber unique transmission number for the file.
   * @returns array of fixed format file lines representing the complete file content.
   */
  createDefaultedStudentLoansFileContent(
    individualReturnedLoans: IndividualReturnedLoan[],
    transmissionNumber: number,
  ): FixedFormatFileLine[] {
    const fileContent: FixedFormatFileLine[] = [];

    // Create and add header record.
    const header = new DefaultedStudentLoansFileHeader();
    header.transmissionDate = new Date();
    header.transmissionNumber = transmissionNumber;
    fileContent.push(header);

    const detailRecords = individualReturnedLoans.map(
      (individualReturnedLoan) =>
        this.mapIndividualReturnedLoanToFileDetail(individualReturnedLoan),
    );
    fileContent.push(...detailRecords);

    // Calculate the sum of BOA balance amounts from all detail records.
    const totalBOAValue = detailRecords.reduce((sum, detail) => {
      const boaItem = detail.populatedBalanceTypeItems.find(
        (item) => item.balanceType === "BOA",
      );
      const boaAmount = boaItem?.balanceAmount ?? 0;
      return sum + boaAmount;
    }, 0);
    const footer = new DefaultedStudentLoansFileFooter();
    footer.transmissionDate = new Date();
    footer.transmissionNumber = 1;
    footer.transmissionSourceID = TRANSMISSION_SOURCE_ID;
    footer.transmissionDescription = "Defaulted Student Loans";
    footer.recordCount = individualReturnedLoans.length;
    footer.totalBOAValue = totalBOAValue;
    footer.isTotalBOAValueNegative = totalBOAValue < 0;
    footer.filler = "";
    fileContent.push(footer);
    return fileContent;
  }

  /**
   * Maps an individual returned loan to a defaulted student loans file detail record.
   * @param individualReturnedLoan the individual returned loan to map.
   * @returns a file detail record with the mapped data.
   */
  private mapIndividualReturnedLoanToFileDetail(
    individualReturnedLoan: IndividualReturnedLoan,
  ): DefaultedStudentLoansFileDetail {
    const { individual, returnedLoan } = individualReturnedLoan;

    const detail = new DefaultedStudentLoansFileDetail();
    detail.clientID = individual.sin;
    detail.lastName = individual.lastName;
    detail.firstName = individual.firstName;
    detail.initials = individual.initialName;
    detail.birthDate = individual.dateOfBirth;
    detail.gender = individual.gender;
    detail.addressEffectiveDate = individual.addressEffectiveDate;
    detail.addressLine1 = individual.addressLine1;
    detail.addressLine2 = individual.addressLine2;
    detail.city = individual.city;
    detail.province = individual.provinceCode;
    detail.country = individual.country;
    detail.postalCode = individual.postalCode;
    detail.homePhone = individual.homePhone;
    detail.originalDueDate = returnedLoan.consolidationDate;
    detail.populatedBalanceTypeItems = POPULATED_BALANCE_TYPES.map(
      (balanceType) => this.buildBalanceTypeItem(balanceType, returnedLoan),
    );
    detail.consolidationDate = returnedLoan.consolidationDate;
    detail.eventDate = returnedLoan.returnEventDate;
    return detail;
  }

  /**
   * Builds a balance type item for the given balance type and returned loan.
   * @param balanceType balance type for which the item is being built.
   * @param returnedLoan returned loan for which the balance type item is being built.
   * @returns balance type item built for the given balance type and returned loan.
   */
  private buildBalanceTypeItem(
    balanceType: DefaultedStudentLoanBalanceType,
    returnedLoan: ReturnedLoan,
  ): BalanceTypeItem {
    const interestType = this.mapInterestRateType(
      returnedLoan.interestRateType,
    );
    const balanceTypeBaseValues = {
      balanceType,
      interestFormulaCode: "SMP",
      interestType,
      interestRate:
        interestType === DefaultedStudentLoanInterestType.Fixed
          ? returnedLoan.fixedInterestRate
          : returnedLoan.variableInterestSpread,
      shouldOverrideInterestRate: YNFlag.Y,
      shouldReportInterest: YNFlag.Y,
      interestCalculationDate: returnedLoan.interestOwingToDate,
    };
    switch (balanceType) {
      case DefaultedStudentLoanBalanceType.BOA:
        return {
          ...balanceTypeBaseValues,
          balanceAmount:
            returnedLoan.totalPrincipalOutstanding +
            returnedLoan.totalInterestOutstanding,
          shouldCalculateInterest: YNFlag.N,
        };
      case DefaultedStudentLoanBalanceType.PRN:
        return {
          ...balanceTypeBaseValues,
          balanceAmount: returnedLoan.totalPrincipalOutstanding,
          shouldCalculateInterest: YNFlag.Y,
        };
      case DefaultedStudentLoanBalanceType.INT:
        return {
          ...balanceTypeBaseValues,
          balanceAmount: returnedLoan.totalInterestOutstanding,
          shouldCalculateInterest: YNFlag.N,
        };
      case DefaultedStudentLoanBalanceType.EXP:
        return {
          ...balanceTypeBaseValues,
          // Balance type value TBD, currently set to 0 as filler.
          balanceAmount: 0,
          shouldCalculateInterest: YNFlag.N,
        };
      case DefaultedStudentLoanBalanceType.DIN:
      case DefaultedStudentLoanBalanceType.PDB:
        return {
          ...balanceTypeBaseValues,
          // Balance type value TBD, currently set to 0 as filler.
          balanceAmount: 0,
          shouldCalculateInterest: YNFlag.Y,
        };
      default:
        throw new Error(`Unsupported balance type: ${balanceType}`);
    }
  }

  /**
   * Maps the interest rate type from the returned loan to the corresponding defaulted student loan interest type.
   * @param interestRateType returned loan interest rate type.
   * @returns corresponding defaulted student loan interest type or undefined if not mapped.
   */
  private mapInterestRateType(
    interestRateType: string,
  ): DefaultedStudentLoanInterestType | undefined {
    switch (interestRateType) {
      case "F":
        return DefaultedStudentLoanInterestType.Fixed;
      case "V":
        return DefaultedStudentLoanInterestType.PrimePlus;
      default:
        return undefined;
    }
  }
}
