import { Injectable, Logger } from "@nestjs/common";
import * as NodeClam from "clamscan";
import { Readable } from "stream";

@Injectable()
export class ClamAVService {
  private logger = new Logger(ClamAVService.name);
  private scanner: NodeClam;

  private async initClam() {
    this.scanner = await new NodeClam().init({
      clamdscan: {
        host: process.env.CLAMAV_HOST,
        port: Number(process.env.CLAMAV_PORT),
      },
    });
  }

  async scanFile(stream: Readable): Promise<boolean> {
    if (!this.scanner) {
      this.initClam();
    }
    try {
      const { isInfected } = await this.scanner.scanStream(stream);
      return isInfected;
    } catch (err) {
      this.logger.error(err);
    }
  }
}
