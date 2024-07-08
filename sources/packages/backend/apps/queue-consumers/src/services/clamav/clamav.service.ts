import { Injectable, Logger } from "@nestjs/common";
import * as NodeClam from "clamscan";
import { Readable } from "stream";

@Injectable()
export class ClamAVService {
  private logger = new Logger(ClamAVService.name);
  private scanner: NodeClam;

  /**
   * Initialize the scanner.
   */
  private async initClam() {
    this.scanner = await new NodeClam().init({
      clamdscan: {
        host: process.env.CLAMAV_HOST,
        port: Number(process.env.CLAMAV_PORT),
      },
    });
  }

  /**
   * Scans the file for viruses.
   * @param stream stream to be scanned.
   * @returns boolean true if the stream is virus infected,
   * false if the stream is not virus infected, and
   * null if the stream could not be scanned for viruses.
   */
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
