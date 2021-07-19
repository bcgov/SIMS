export interface FileCreateDto {
  fileName: string;
  uniqueFileName: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface FormUploadFileInfo {
  name: string;
  originalName: string;
  size: number;
  storage: string;
  type: string;
  url: string;
}
