import { OfferingIntensity } from "../database/entities";
import {
  CreateRequestFileNameResult,
  DATE_FORMAT,
  NUMBER_FILLER,
} from "../esdc-integration/models/esdc-integration.model";
import { EntityManager } from "typeorm";
import { StringBuilder } from "./string-builder";

/**
 * Expected file name of the request file.
 * @param filenameCode different files has different filename codes, to be created.
 * @param OfferingIntensity offering intensity of the application
 *  where file is requested.
 * @param entityManager
 * @returns Full file path of the file to be saved on the SFTP.
 */
export async function createRequestFileName(
  filenameCode: string,
  entityManager?: EntityManager,
  offeringIntensity?: OfferingIntensity,
): Promise<CreateRequestFileNameResult> {
  const fileNameArray = new StringBuilder();
  fileNameArray.append(`${this.esdcConfig.environmentCode}${filenameCode}`);
  let fileNameSequence: number;
  if (offeringIntensity && OfferingIntensity.partTime === offeringIntensity) {
    fileNameArray.append("PT.");
  }
  fileNameArray.appendDate(new Date(), DATE_FORMAT);
  this.sequenceService.consumeNextSequenceWithExistingEntityManager(
    fileNameArray.toString(),
    entityManager,
    async (nextSequenceNumber: number) => {
      fileNameSequence = nextSequenceNumber;
    },
  );
  fileNameArray.append(".");
  fileNameArray.appendWithStartFiller(
    fileNameSequence.toString(),
    3,
    NUMBER_FILLER,
  );
  fileNameArray.append(".DAT");
  const fileName = fileNameArray.toString();
  const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
  return { fileName, filePath } as CreateRequestFileNameResult;
}
