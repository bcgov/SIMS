import { Injectable } from "@nestjs/common";
import * as NodeClam from "clamscan";
import { Readable } from "stream";
import { VirusScanCode } from "@sims/services/queue";
import {
  CONNECTION_FAILED,
  SERVER_UNAVAILABLE,
  UNKNOWN_ERROR,
} from "@sims/services/constants";

@Injectable()
export class ClamAVService {
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
  async scanFile(stream: Readable): Promise<VirusScanCode> {
    const virusScanResult = {
      isInfected: null,
      errorCode: "",
    };
    try {
      if (!this.scanner) {
        await this.initClam();
      }
      const { isInfected } = await this.scanner.scanStream(stream);
      return { ...virusScanResult, isInfected };
    } catch (err) {
      if (err.code === "ECONNREFUSED") {
        return { ...virusScanResult, errorCode: CONNECTION_FAILED };
      }
      if (err.code === "ENOTFOUND") {
        return { ...virusScanResult, errorCode: SERVER_UNAVAILABLE };
      }
      return { ...virusScanResult, errorCode: UNKNOWN_ERROR };
    }
  }
}
