import { Application } from "../../database/entities";

export interface ApplicationOverriddenResult {
  overriddenApplication: Application;
  createdApplication: Application;
}
