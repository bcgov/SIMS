import { Injectable, Logger } from "@nestjs/common";
import * as NodeClam from "clamscan";
import { Readable } from "stream";
import { ScannedFileInfo } from "./clamav.models";
import { StudentFile } from "@sims/sims-db";

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

  async scanFiles(studentFiles: StudentFile[]): Promise<ScannedFileInfo[]> {
    let stream: Readable;
    let isInfected: boolean;
    const scannedFileInfos: ScannedFileInfo[] = [];
    await Promise.all(
      studentFiles.map(async (studentFile) => {
        stream = Readable.from(studentFile.fileContent);
        isInfected = await this.scanFile(stream);
        scannedFileInfos.push({
          uniqueFileName: studentFile.uniqueFileName,
          virusScanStatus: isInfected,
        });
      }),
    );
    return scannedFileInfos;
  }

  private async scanFile(stream: Readable): Promise<boolean> {
    try {
      const { isInfected } = await this.scanner.scanStream(stream);
      return isInfected;
    } catch (err) {
      this.logger.error(err);
    }
  }
}
