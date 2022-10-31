import { ESDCFileHandler } from "../esdc-integration/esdc-file-handler";
import { ConfigService } from "../services";

export class IERRequestService extends ESDCFileHandler {
  constructor(configService: ConfigService) {
    super(configService);
  }
}
