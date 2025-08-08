export interface ApplicationDataException {
  key: string;
  description: string;
  index: number;
  hashableContent: unknown;
  files: ApplicationDataExceptionFile[];
}

export interface ApplicationDataExceptionFile {
  name: string;
  originalName: string;
}

export interface ApplicationDataExceptionHashed
  extends ApplicationDataException {
  fullHashContent: string;
}
