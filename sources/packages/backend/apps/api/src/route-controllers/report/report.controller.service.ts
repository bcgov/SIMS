import { Injectable } from "@nestjs/common";
import { getFileNameAsCurrentTimestamp } from "@sims/utilities";
import { Response } from "express";
import { Readable } from "stream";
/**
 * Service layer for reports.
 */
@Injectable()
export class ReportControllerService {
  /**
   * Stream file as downloadable response.
   * @param response http response as file.
   * @param reportName report name.
   * @param fileContent content of the file.
   */
  streamFile(response: Response, reportName: string, fileContent: string) {
    const timestamp = getFileNameAsCurrentTimestamp();
    const filename = `${reportName}_${timestamp}.csv`;
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`,
    );
    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Length", fileContent.toString().length);

    const stream = new Readable();
    stream.push(fileContent.toString());
    stream.push(null);
    stream.pipe(response);
  }
}
