import { OfferingIntensity } from "../database/entities";
import {
  CreateRequestFileNameResult,
  DATE_FORMAT,
  NUMBER_FILLER,
} from "./models/esdc-integration.model";
import { StringBuilder } from "../utilities/string-builder";
import { ConfigService } from "../services";
import { ESDCIntegrationConfig } from "../types";
export abstract class ESDCFileHandler {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(config: ConfigService) {
    this.esdcConfig = config.getConfig().ESDCIntegration;
  }
  /**
   * Expected file name of the request file.
   * @param filenameCode different files has different filename codes, to be created.
   * @param offeringIntensity offering intensity of the application
   *  where file is requested.
   * @param nextSequenceNumber
   * @returns Full file path of the file to be saved on the SFTP.
   */
  async createRequestFileName(
    filenameCode: string,
    nextSequenceNumber: number,
    offeringIntensity?: OfferingIntensity,
  ): Promise<CreateRequestFileNameResult> {
    const fileNameArray = new StringBuilder();
    fileNameArray.append(`${this.esdcConfig.environmentCode}${filenameCode}`);
    if (offeringIntensity === OfferingIntensity.partTime) {
      fileNameArray.append("PT.");
    }
    fileNameArray.appendDate(new Date(), DATE_FORMAT);
    fileNameArray.append(".");
    fileNameArray.appendWithStartFiller(
      nextSequenceNumber.toString(),
      3,
      NUMBER_FILLER,
    );
    fileNameArray.append(".DAT");
    const fileName = fileNameArray.toString();
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return { fileName, filePath } as CreateRequestFileNameResult;
  }
}
