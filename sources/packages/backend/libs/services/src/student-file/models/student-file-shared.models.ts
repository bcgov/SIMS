import { FileOriginType } from "@sims/sims-db";

export interface CreateFile {
  fileName: string;
  uniqueFileName: string;
  mimeType: string;
  fileContent: Buffer;
  groupName: string;
  fileOrigin: FileOriginType;
}
