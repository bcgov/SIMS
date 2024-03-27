/**
 * Student loan balance details.
 */
class StudentLoanBalanceDetailAPIOutDTO {
  balanceDate: string;
  cslBalance: number;
}

/**
 * Student loan balance.
 */
export class StudentLoanBalanceAPIOutDTO {
  loanBalanceDetails: StudentLoanBalanceDetailAPIOutDTO[];
}
