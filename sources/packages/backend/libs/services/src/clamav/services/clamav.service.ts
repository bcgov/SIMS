import { Injectable } from "@nestjs/common";
import { ScanResult } from "@sims/services/clamav/models/clamav.models";
import * as NodeClam from "clamscan";

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
  async scanFile(stream: NodeJS.ReadableStream): Promise<boolean | null> {
    if (!this.scanner) {
      await this.initClam();
    }
    const promise = new Promise<boolean | null>((resolve, reject) => {
      const passthroughStream = this.scanner.passthrough();
      passthroughStream.on("scan-complete", (result: ScanResult) => {
        resolve(result.isInfected);
      });
      passthroughStream.on("error", (error: Error) => {
        reject(error);
      });
      passthroughStream.on("timeout", () => {
        reject(new Error("Connection timed out."));
      });
      stream.pipe(passthroughStream);
      passthroughStream.resume();
    });
    return promise;
  }
}
