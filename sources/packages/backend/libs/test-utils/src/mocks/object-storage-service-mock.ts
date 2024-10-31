import { ObjectStorageService } from "@sims/integrations/object-storage";
import { Readable } from "stream";

export const S3_DEFAULT_MOCKED_FILE_CONTENT = "Some dummy file content.";

/**
 * Creates a mocked object storage service.
 * @returns a mocked object storage service.
 */
export function createObjectStorageServiceMock(): ObjectStorageService {
  const mockedObjectStorageService = {} as ObjectStorageService;
  resetObjectStorageServiceMock(mockedObjectStorageService);
  return mockedObjectStorageService;
}

/**
 * Resets the mocked object storage service back to its original mocks.
 * @param mock the mocked object storage service to be reset.
 */
export function resetObjectStorageServiceMock(
  mock: ObjectStorageService,
): void {
  mock.putObject = jest.fn(() => Promise.resolve());
  mock.getObject = createFakeGetObjectResponse(S3_DEFAULT_MOCKED_FILE_CONTENT);
}

/**
 * Creates a mock implementation for the getObject method of the {@linkcode ObjectStorageService}.
 * @param fileContent the content of the file to be returned.
 * @returns a jest mock function that resolves a promise.
 */
export function createFakeGetObjectResponse(fileContent: string): jest.Mock {
  return jest.fn(() => {
    const buffer = Buffer.from(fileContent);
    const stream = Readable.from(buffer);
    return Promise.resolve({
      contentLength: buffer.length,
      contentType: "text/html; charset=utf-8",
      body: stream,
    });
  });
}
