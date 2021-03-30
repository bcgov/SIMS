import { ConfigApi } from "./ConfigApi";
import { StudentApi } from "./StudentApi";
import { UserApi } from "./UserApi";
import { InstitutionApi } from "./Institution";
import { DynamicFormsApi } from "./DynamicForms";
import { WorkflowApi } from "./WorkflowApi";

const ApiClient = {
  Configs: new ConfigApi(),
  Students: new StudentApi(),
  User: new UserApi(),
  Institution: new InstitutionApi(),
  DynamicForms: new DynamicFormsApi(),
  Workflow: new WorkflowApi(),
};

export default ApiClient;
