/**
 * Student loan balance details of a month.
 */
class StudentMonthlyLoanBalanceDetailAPIOutDTO {
  balanceDate: string;
  cslBalance: number;
}

/**
 * Monthly loan balance details of a student
 * upto 12 months from current date.
 */
export class StudentLoanBalanceAPIOutDTO {
  loanBalanceDetails: StudentMonthlyLoanBalanceDetailAPIOutDTO[];
}
