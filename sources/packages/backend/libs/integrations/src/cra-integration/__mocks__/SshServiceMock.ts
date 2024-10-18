import * as Client from "ssh2-sftp-client";
import * as fs from "fs";
import * as path from "path";
import { SshService } from "@sims/integrations/services";
import { FILE_DEFAULT_ENCODING } from "@sims/utilities";

const MOCKED_RESPONSE_FILES = [
  "CCRA_RESPONSE_ABCSL00001.TXT",
  "CCRA_RESPONSE_ABCSL00002.TXT",
];

const SshServiceMock = new SshService();

// SSH Client Mock that will download mocked files
// from folder __mocks__/response-folder
const sshClientMock = new Client();
// Mock list method.
jest.spyOn(sshClientMock, "list").mockImplementation(() => {
  const fileInfos = MOCKED_RESPONSE_FILES.map((fileName) => {
    const fileInfo = {} as Client.FileInfo;
    fileInfo.name = fileName;
    return fileInfo;
  });
  return Promise.resolve(fileInfos);
});
// Mock get method. This method accepts the file name input and returns
// the content of the mocked file on folder __mocks__/response-folder.
jest.spyOn(sshClientMock, "get").mockImplementation((filePath: string) => {
  const mockedFilePath = path.resolve(__dirname, filePath);
  return Promise.resolve(
    fs.readFileSync(mockedFilePath, FILE_DEFAULT_ENCODING),
  );
});
// // Mock createClient method.
jest.spyOn(SshServiceMock, "createClient").mockImplementation(() => {
  return Promise.resolve(sshClientMock);
});

export default SshServiceMock;
