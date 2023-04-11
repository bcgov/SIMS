import * as Client from "ssh2-sftp-client";
import { SshService } from "@sims/integrations/services";

/**
 * Creates a mocked {@link SshService} with a mocked SSH {@link Client}
 * to allow skip the SFTP interactions.
 * @returns mocked {@link SshService}.
 */
export function createSSHServiceMock(): SshService {
  const sshClientMock = new Client();
  sshClientMock.list = jest.fn();
  sshClientMock.put = jest.fn();
  sshClientMock.get = jest.fn();
  const sshServiceMock = new SshService();
  sshServiceMock.createClient = jest.fn().mockResolvedValue(sshClientMock);
  SshService.closeQuietly = jest.fn();
  return sshServiceMock;
}
