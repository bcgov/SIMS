import * as faker from "faker";
import {
  FileOriginType,
  Student,
  StudentFile,
  User,
  VirusScanStatus,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { createFakeStudent } from "./student";

/**
 * Create fake student file upload object.
 * @params relations entity relations
 * - `student` related student relation.
 * - `creator` related user relation.
 * @param options related to StudentFile
 * - `fileOrigin` option for specifying the fileOrigin
 * @returns created studentFile object.
 */
export function createFakeStudentFileUpload(
  relations?: {
    student?: Student;
    creator?: User;
  },
  options?: {
    fileOrigin?: FileOriginType;
    groupName?: string;
  },
): StudentFile {
  const studentFile = new StudentFile();
  studentFile.fileName = faker.system.fileName();
  studentFile.uniqueFileName =
    studentFile.fileName +
    faker.datatype.uuid() +
    "." +
    faker.system.fileType();
  studentFile.groupName = options?.groupName ?? "Ministry communications";
  studentFile.student = relations?.student ?? createFakeStudent();
  studentFile.creator = relations?.creator;
  studentFile.fileOrigin = options?.fileOrigin ?? FileOriginType.Ministry;
  studentFile.virusScanStatus = VirusScanStatus.Pending;
  return studentFile;
}

/**
 * Save fake student file upload.
 * @param dataSource data source to persist studentFileUpload.
 * @param relations entity relations.
 * - `student` related student relation.
 * - `creator` related user relation.
 * @param options related to StudentFile
 * - `fileOrigin` option for specifying the fileOrigin
 * @returns persisted studentFile.
 */
export async function saveFakeStudentFileUpload(
  dataSource: DataSource,
  relations?: { student?: Student; creator?: User },
  options?: { fileOrigin: FileOriginType; groupName?: string },
): Promise<StudentFile> {
  const studentFile = createFakeStudentFileUpload(relations, options);
  const studentFileRepo = dataSource.getRepository(StudentFile);
  return studentFileRepo.save(studentFile);
}
