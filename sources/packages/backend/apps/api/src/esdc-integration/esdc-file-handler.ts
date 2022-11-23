import {
  CreateRequestFileNameResult,
  DATE_FORMAT,
  NUMBER_FILLER,
} from "./models/esdc-integration.model";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { StringBuilder } from "@sims/utilities";

export abstract class ESDCFileHandler {
  esdcConfig: ESDCIntegrationConfig;
  constructor(config: ConfigService) {
    this.esdcConfig = config.esdcIntegration;
  }
  /**
   * Expected file name of the request file.
   * @param filenameCode different files has different filename codes, to be created.
   * @param nextSequenceNumber
   * @returns Full file path of the file to be saved on the SFTP.
   */
  async createRequestFileName(
    filenameCode: string,
    nextSequenceNumber: number,
  ): Promise<CreateRequestFileNameResult> {
    const fileNameArray = new StringBuilder();
    fileNameArray.append(`${this.esdcConfig.environmentCode}${filenameCode}`);
    fileNameArray.appendDate(new Date(), DATE_FORMAT);
    fileNameArray.append(".");
    fileNameArray.appendWithStartFiller(
      nextSequenceNumber.toString(),
      3,
      NUMBER_FILLER,
    );
    const fileName = fileNameArray.toString();
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return { fileName, filePath } as CreateRequestFileNameResult;
  }
}
