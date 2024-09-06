import { ObjectStorageService } from "@sims/integrations/object-storage";
import { Readable } from "stream";

export function createObjectStorageServiceMock(): ObjectStorageService {
  const mockedObjectStorageService = {} as ObjectStorageService;
  mockedObjectStorageService.putObject = jest.fn(() => Promise.resolve());
  mockedObjectStorageService.getObject = jest.fn(() => {
    const buffer = Buffer.from("Dummy Text");
    const stream = Readable.from(buffer);
    return Promise.resolve({
      contentLength: 10,
      contentType: "text/html; charset=utf-8",
      body: stream,
    });
  });
  return mockedObjectStorageService;
}
