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

export function mockDownloadFiles(
  sshClientMock: DeepMocked<Client>,
  filePaths: string[],
): void {
  const fileInfos = filePaths.map(
    (filePath) => ({ name: filePath } as Client.FileInfo),
  );
  sshClientMock.list.mockResolvedValue(fileInfos);
  sshClientMock.get.mockImplementation((filePath: string) => {
    return Promise.resolve(readFileSync(filePath));
  });
}
