import { Application } from "src/database/entities";

export interface ApplicationOverriddenResult {
  overriddenApplication: Application;
  createdApplication: Application;
}
