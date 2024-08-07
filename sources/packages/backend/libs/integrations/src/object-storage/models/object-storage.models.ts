export interface StorageObject {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface GetObjectResult {
  contentLength: number;
  contentType: string;
  body: NodeJS.ReadableStream;
}
