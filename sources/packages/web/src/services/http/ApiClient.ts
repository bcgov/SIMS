import { ConfigApi } from "./ConfigApi"
import { StudentApi } from "./StudentApi"
import { UserApi } from "./UserApi"

const ApiClient = {
    Configs: new ConfigApi(),
    Students: new StudentApi(),
    User: new UserApi()
}

export default ApiClient;
