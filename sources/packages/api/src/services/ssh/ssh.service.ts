import { Injectable, Scope } from "@nestjs/common";
import { SFTPConfig } from "../../types";
import * as Client from "ssh2-sftp-client";

@Injectable({ scope: Scope.TRANSIENT })
export class SshService {
  public async createClient(config: SFTPConfig): Promise<Client> {
    const client = new Client();
    await client.connect(config);
    return client;
  }
}
