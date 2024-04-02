/**
 * Student loan balance details.
 */
export interface StudentLoanBalanceDetailAPIOutDTO {
  balanceDate: string;
  cslBalance: number;
}

/**
 * Student loan balance.
 */
export interface StudentLoanBalanceAPIOutDTO {
  loanBalanceDetails: StudentLoanBalanceDetailAPIOutDTO[];
}
