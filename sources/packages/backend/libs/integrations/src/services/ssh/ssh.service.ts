import { Injectable } from "@nestjs/common";
import { SSHError, SSHErrorCodes } from "@sims/integrations/services/ssh";
import { SFTPConfig } from "@sims/utilities/config";
import * as Client from "ssh2-sftp-client";

@Injectable()
export class SshService {
  /**
   * Creates a connected server ready to execute commands.
   * @param config
   * @returns Connected client.
   */
  async createClient(config: SFTPConfig): Promise<Client> {
    const client = new Client();
    await client.connect(config);
    return client;
  }

  /**
   * Force the connection to be closed ensuring the an
   * exception will not be raised in the process.
   * @param client
   */
  static async closeQuietly(client: Client): Promise<void> {
    try {
      await client.end();
    } catch {
      // It appears that when the sftp server is running on Windows,
      // a ECONNRESET error signal is raised when the end() method is called.
      // Source: https://www.npmjs.com/package/ssh2-sftp-client#sec-5-2-21
    }
  }

  /**
   * Check if the provided error is an SSH error with the given error code.
   * @param error SSH error to be checked.
   * @param errorCode Error code to be checked.
   * @returns True if the error is an SSH error with the given code, false otherwise.
   */
  static hasError(error: unknown, errorCode: SSHErrorCodes): boolean {
    return error && (error as SSHError).code === errorCode;
  }
}
