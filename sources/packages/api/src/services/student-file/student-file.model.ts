export interface CreateFile {
  fileName: string;
  uniqueFileName: string;
  groupName: string;
  mimeType: string;
  fileContent: Buffer;
}
