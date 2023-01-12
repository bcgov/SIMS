import * as Client from "ssh2-sftp-client";
import { SshService } from "@sims/integrations/services";

const sshServiceMock = new SshService();
const sshClientMock = new Client();

jest.spyOn(sshServiceMock, "createClient").mockImplementation(() => {
  return Promise.resolve(sshClientMock);
});

jest
  .spyOn(sshClientMock, "put")
  .mockImplementation(
    (
      _input: string | Buffer | NodeJS.ReadableStream,
      remoteFilePath: string,
    ) => {
      return Promise.resolve(
        `SSH 'put' method executed from mocked SSH service, remoteFilePath: ${remoteFilePath}`,
      );
    },
  );

jest.spyOn(SshService, "closeQuietly").mockImplementation(() => {
  return Promise.resolve();
});

export default sshServiceMock;
