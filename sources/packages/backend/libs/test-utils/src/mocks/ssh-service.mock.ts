import * as Client from "ssh2-sftp-client";
import { SshService } from "@sims/integrations/services";

/**
 * Creates a mocked {@link SshService} with a mocked SSH {@link Client}.
 * @param sshClientMock SSH client to be returned by the {@link SshService}.
 * @returns mocked {@link SshService}.
 */
export function createSSHServiceMock(sshClientMock: Client): SshService {
  const sshServiceMock = new SshService();
  sshServiceMock.createClient = jest.fn().mockResolvedValue(sshClientMock);
  SshService.closeQuietly = jest.fn();
  return sshServiceMock;
}
