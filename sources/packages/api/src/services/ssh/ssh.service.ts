import { Injectable, Scope } from "@nestjs/common";
import { SFTPConfig } from "../../types";
import * as Client from "ssh2-sftp-client";

@Injectable()
export class SshService {
  /**
   * Creates a conneced server ready to execute commands.
   * @param config
   * @returns Connected client.
   */
  public async createClient(config: SFTPConfig): Promise<Client> {
    const client = new Client();
    await client.connect(config);
    return client;
  }

  /**
   * Force the dataSource to be closed ensuring the an
   * exception will not be raised in the process.
   * @param client
   */
  public static async closeQuietly(client: Client) {
    try {
      await client.end();
    } catch {
      // It appears that when the sftp server is running on Windows,
      // a ECONNRESET error signal is raised when the end() method is called.
      // Source: https://www.npmjs.com/package/ssh2-sftp-client#sec-5-2-21
    }
  }
}
