import { ConfigApi } from "./ConfigApi"
import { StudentApi } from "./StudentApi"

const ApiClient = {
    Configs: new ConfigApi(),
    Students: new StudentApi()
}

export default ApiClient;
