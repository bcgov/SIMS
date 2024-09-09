import { ObjectStorageService } from "@sims/integrations/object-storage";
import { Readable } from "stream";

export const DUMMY_FILE_CONTENT = "Some dummy file content.";

/**
 * Creates a mocked object storage service.
 * @returns a mocked object storage service.
 */
export function createObjectStorageServiceMock(): ObjectStorageService {
  const mockedObjectStorageService = {} as ObjectStorageService;
  mockedObjectStorageService.putObject = jest.fn(() => Promise.resolve());
  mockedObjectStorageService.getObject = jest.fn(() => {
    const buffer = Buffer.from(DUMMY_FILE_CONTENT);
    const stream = Readable.from(buffer);
    return Promise.resolve({
      contentLength: buffer.length,
      contentType: "text/html; charset=utf-8",
      body: stream,
    });
  });
  return mockedObjectStorageService;
}
