import { Injectable, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import { StudentFileService } from "../../services";
import { Readable } from "stream";
import { FileCreateAPIOutDTO } from "../models/common.dto";

@Injectable()
export class StudentControllerService {
  constructor(private readonly fileService: StudentFileService) {}

  /**
   * Allow files uploads to a particular student.
   * @param studentId student id.
   * @param file file content.
   * @param uniqueFileName unique file name (name+guid).
   * @param groupName friendly name to group files. Currently using
   * the value from 'Directory' property from form.IO file component.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns created file information.
   */
  async uploadFile(
    studentId: number,
    file: Express.Multer.File,
    uniqueFileName: string,
    groupName: string,
    auditUserId: number,
  ): Promise<FileCreateAPIOutDTO> {
    const createdFile = await this.fileService.createFile(
      {
        fileName: file.originalname,
        uniqueFileName: uniqueFileName,
        groupName: groupName,
        mimeType: file.mimetype,
        fileContent: file.buffer,
      },
      studentId,
      auditUserId,
    );

    return {
      fileName: createdFile.fileName,
      uniqueFileName: createdFile.uniqueFileName,
      url: `students/files/${createdFile.uniqueFileName}`,
      size: createdFile.fileContent.length,
      mimetype: createdFile.mimeType,
    };
  }

  /**
   * Get a student file and write it to the HTTP response.
   * @response represents the response object that will be returned from
   * the API and the one that will be changed to allow the file download,
   * adding the necessary headers and writing the file content to its stream.
   * @param uniqueFileName unique file name (name+guid).
   * @param studentId student id.
   */
  async writeFileToResponse(
    response: Response,
    uniqueFileName: string,
    studentId?: number,
  ) {
    const studentFile = await this.fileService.getStudentFile(
      uniqueFileName,
      studentId,
    );

    if (!studentFile) {
      throw new NotFoundException(
        "Requested file was not found or the user does not have access to it.",
      );
    }

    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${studentFile.fileName}`,
    );
    response.setHeader("Content-Type", studentFile.mimeType);
    response.setHeader("Content-Length", studentFile.fileContent.length);

    const stream = new Readable();
    stream.push(studentFile.fileContent);
    stream.push(null);

    stream.pipe(response);
  }
}
