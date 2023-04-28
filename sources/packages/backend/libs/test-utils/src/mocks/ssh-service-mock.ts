import * as Client from "ssh2-sftp-client";
import { SshService } from "@sims/integrations/services";
import { DeepMocked } from "@golevelup/ts-jest";
import { END_OF_LINE } from "@sims/utilities";
import { readFileSync } from "fs";

export interface UploadedFile {
  remoteFilePath: string;
  fileLines: string[];
}

/**
 * Creates a mocked {@link SshService} with a mocked SSH {@link Client}.
 * @param sshClientMock SSH client to be returned by the {@link SshService}.
 * @returns mocked {@link SshService}.
 */
export function createSSHServiceMock(
  sshClientMock: DeepMocked<Client>,
): SshService {
  const sshServiceMock = new SshService();
  sshServiceMock.createClient = jest.fn().mockResolvedValue(sshClientMock);
  SshService.closeQuietly = jest.fn();
  return sshServiceMock;
}

/**
 * Get the parameters provided to the put method of the SSH client that
 * represents the data that would be uploaded to the SFTP in a real scenario.
 * @param sshClientMock SSH mocked client.
 * @returns file name and file content of the supposed-to-be uploaded file.
 */
export function getUploadedFile(
  sshClientMock: DeepMocked<Client>,
): UploadedFile {
  const uploadedFile = {} as UploadedFile;
  const [[input, remoteFilePath]] = sshClientMock.put.mock.calls;
  if (input) {
    uploadedFile.fileLines = input.toString().split(END_OF_LINE);
  }
  if (remoteFilePath) {
    uploadedFile.remoteFilePath = remoteFilePath.toString();
  }
  return uploadedFile;
}

/**
 * Create the mocks to allow the simulation of a file download from
 * the SFTP. Based on file names provided, real files content will be
 * retrieved from the disk.
 * When performing SFTP calls to request the files two methods are used.
 * The first one (list) is used to retrieve the files available to be downloaded,
 * the second one (get) will be actually returning the file content.
 * This helper allows the mock of the list and get methods is a way the first one
 * will provide the file name to the second one, allowing it to know which specific
 * file should be retrieved from the disk.
 * @param sshClientMock SSH client mock to have the list and get
 * methods mocked.
 * @param filePaths list of files to be returned from the disk.
 * @param fileTransformation allow the file content to be manipulated
 * before be returned from the SSH get method mock result.
 */
export function mockDownloadFiles(
  sshClientMock: DeepMocked<Client>,
  filePaths: string[],
  fileTransformation?: (fileContent: string) => string,
): void {
  const fileInfos = filePaths.map(
    (filePath) => ({ name: filePath } as Client.FileInfo),
  );
  sshClientMock.list.mockResolvedValue(fileInfos);
  sshClientMock.get.mockImplementation((filePath: string) => {
    let fileContent = readFileSync(filePath).toString();
    if (fileTransformation) {
      fileContent = fileTransformation(fileContent);
    }
    return Promise.resolve(fileContent);
  });
}
