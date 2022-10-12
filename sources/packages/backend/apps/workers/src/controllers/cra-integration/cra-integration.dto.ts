export interface CreateIncomeRequestJobInDTO {
  applicationId: number;
  taxYear: number;
  reportedIncome: number;
  supportingUserId?: number;
}

export interface CreateIncomeRequestJobOutDTO {
  incomeVerificationId: number;
}

export interface CheckIncomeRequestJobInDTO {
  incomeVerificationId: number;
}

export interface CheckIncomeRequestJobOutDTO {
  incomeVerificationCompleted: boolean;
}
