import { Injectable, Logger } from "@nestjs/common";
import * as NodeClam from "clamscan";
import { Readable } from "stream";

@Injectable()
export class ClamAVService {
  private logger = new Logger(ClamAVService.name);
  private scanner: NodeClam;

  constructor() {
    this.initClam();
  }

  private async initClam() {
    this.scanner = await new NodeClam().init({
      clamdscan: {
        host: "localhost",
        port: 3310,
      },
    });
  }

  async scanFile(stream: Readable): Promise<boolean> {
    try {
      const { isInfected } = await this.scanner.scanStream(stream);
      return isInfected;
    } catch (err) {
      this.logger.error(err);
    }
  }
}
