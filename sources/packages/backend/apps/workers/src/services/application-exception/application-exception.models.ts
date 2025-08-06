export interface ApplicationDataException extends Record<string, unknown> {
  key: string;
  description?: string;
  hashableContent: unknown;
  files?: ApplicationDataExceptionFile[];
}

export interface ApplicationDataExceptionFile {
  name: string;
  originalName: string;
}
