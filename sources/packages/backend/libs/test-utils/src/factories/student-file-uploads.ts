import { faker } from "@faker-js/faker";
import {
  FileOriginType,
  Note,
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
 * - `deletionNote` related deletion note relation.
 * @param options related to StudentFile
 * - `fileName` option for specifying the file name.
 * - `fileOrigin` option for specifying the file origin.
 * - `groupName` option for specifying the group name.
 * - `hash` option for specifying the file hash.
 * - `deletedAt` option for specifying if the file is soft deleted.
 * @returns created studentFile object.
 */
export function createFakeStudentFileUpload(
  relations?: {
    student?: Student;
    creator?: User;
    deletionNote?: Note;
  },
  options?: {
    fileName?: string;
    fileOrigin?: FileOriginType;
    groupName?: string;
    hash?: string;
    deletedAt?: Date;
  },
): StudentFile {
  const studentFile = new StudentFile();
  studentFile.fileName = options?.fileName ?? faker.system.fileName();
  studentFile.uniqueFileName =
    studentFile.fileName + faker.string.uuid() + "." + faker.system.fileType();
  studentFile.groupName = options?.groupName ?? "Ministry communications";
  studentFile.student = relations?.student ?? createFakeStudent();
  studentFile.creator = relations?.creator;
  studentFile.fileOrigin = options?.fileOrigin ?? FileOriginType.Ministry;
  studentFile.virusScanStatus = VirusScanStatus.Pending;
  studentFile.fileHash =
    options?.hash ?? faker.string.alphanumeric({ length: 64 });
  studentFile.deletedAt = options?.deletedAt;
  studentFile.deletionNote = relations?.deletionNote;
  return studentFile;
}

/**
 * Save fake student file upload.
 * @param dataSource data source to persist studentFileUpload.
 * @param relations entity relations.
 * - `student` related student relation.
 * - `creator` related user relation.
 * - `deletionNote` related deletion note relation.
 * @param options related to StudentFile
 * - `fileName` option for specifying the file name.
 * - `fileOrigin` option for specifying the file origin.
 * - `groupName` option for specifying the group name.
 * - `hash` option for specifying the file hash.
 * - `deletedAt` option for specifying if the file is soft deleted.
 * @returns persisted studentFile.
 */
export async function saveFakeStudentFileUpload(
  dataSource: DataSource,
  relations?: { student?: Student; creator?: User; deletionNote?: Note },
  options?: {
    fileName?: string;
    fileOrigin?: FileOriginType;
    groupName?: string;
    hash?: string;
    deletedAt?: Date;
  },
): Promise<StudentFile> {
  const studentFile = createFakeStudentFileUpload(relations, options);
  const studentFileRepo = dataSource.getRepository(StudentFile);
  return studentFileRepo.save(studentFile);
}
