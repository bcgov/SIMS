/**
 * Student loan balance details of a month.
 */
export class StudentLoanBalanceDetailsAPIOutDTO {
  balanceDate: string;
  cslBalance: number;
}

/**
 * Monthly loan balance details of a student
 * upto 12 months from current date.
 */
export class StudentMonthlyLoanBalanceAPIOutDTO {
  loanBalanceDetails: StudentLoanBalanceDetailsAPIOutDTO[];
}
