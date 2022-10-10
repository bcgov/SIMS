export class CreateIncomeRequestJobInDTO {
  applicationId: number;
  taxYear: number;
  reportedIncome: number;
  supportingUserId?: number;
}

export class CreateIncomeRequestJobOutDTO {
  incomeVerificationId: number;
}

export class CheckIncomeRequestJobInDTO {
  incomeVerificationId: number;
}

export class CheckIncomeRequestJobOutDTO {
  incomeVerificationCompleted: boolean;
}
