import { Injectable } from "@nestjs/common";
import * as Client from "ssh2-sftp-client";

@Injectable()
export class SshService {
  public async connect(): Promise<any> {
    const client = new Client();
    await client.connect({
      host: "linda.dmz",
      port: 22,
      username: "ASIGNO_A",
      passphrase: process.env.ZONE_B_SFTP_PRIVATE_KEY_PASSPHRASE,
      privateKey: process.env.ZONE_B_SFTP_PRIVATE_KEY,
    });

    const response = await client.put(
      Buffer.from("File Content Test"),
      "CRA/In/Test.txt",
    );
    console.log(response);

    return response;
  }
}
