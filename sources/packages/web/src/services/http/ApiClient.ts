import { ConfigApi } from "./ConfigApi";
import { StudentApi } from "./StudentApi";
import { UserApi } from "./UserApi";
import { InstitutionApi } from "./Institution";
import { DynamicFormsApi } from "./DynamicForms";
import { WorkflowApi } from "./WorkflowApi";
import { ApplicationApi } from "./ApplicationApi";
import { InstitutionLocationApi } from './InstitutionLocation';

const ApiClient = {
  Configs: new ConfigApi(),
  Students: new StudentApi(),
  User: new UserApi(),
  Institution: new InstitutionApi(),
  DynamicForms: new DynamicFormsApi(),
  Workflow: new WorkflowApi(),
  Application: new ApplicationApi(),
  InstitutionLocation: new InstitutionLocationApi(),
};

export default ApiClient;
