import { Injectable, Logger } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
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
   * @param processSummary process summary logs.
   * @returns boolean true if the stream is virus infected,
   * false if the stream is not virus infected, and
   * null if the stream could not be scanned for viruses.
   */
  async scanFile(
    stream: Readable,
    processSummary: ProcessSummary,
  ): Promise<boolean> {
    try {
      if (!this.scanner) {
        await this.initClam();
      }
      const { isInfected } = await this.scanner.scanStream(stream);
      return isInfected;
    } catch (err) {
      if (err.code === "ECONNREFUSED") {
        processSummary.error("Connection to ClamAV server failed.");
        return;
      }
      processSummary.error(err);
    }
  }
}
