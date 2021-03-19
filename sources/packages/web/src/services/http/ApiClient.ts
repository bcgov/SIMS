import { ConfigApi } from "./ConfigApi";
import { StudentApi } from "./StudentApi";
import { UserApi } from "./UserApi";
import { InstitutionApi } from "./Institution";

const ApiClient = {
  Configs: new ConfigApi(),
  Students: new StudentApi(),
  User: new UserApi(),
  Institution: new InstitutionApi(),
};

export default ApiClient;
