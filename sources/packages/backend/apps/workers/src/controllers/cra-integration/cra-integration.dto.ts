import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  INCOME_VERIFICATION_COMPLETED,
  INCOME_VERIFICATION_ID,
  REPORTED_INCOME,
  SUPPORTING_USER_ID,
  TAX_YEAR,
} from "@sims/services/workflow/variables/cra-integration-income-verification";

export interface CreateIncomeRequestJobInDTO {
  [APPLICATION_ID]: number;
  [TAX_YEAR]: number;
  [REPORTED_INCOME]: number;
  [SUPPORTING_USER_ID]?: number;
}

export interface CreateIncomeRequestJobOutDTO {
  [INCOME_VERIFICATION_ID]: number;
}

export interface CheckIncomeRequestJobInDTO {
  [INCOME_VERIFICATION_ID]: number;
}

export interface CheckIncomeRequestJobOutDTO {
  [INCOME_VERIFICATION_COMPLETED]: boolean;
}
