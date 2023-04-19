import * as faker from "faker";
import { FileOriginType, Student, StudentFile, User } from "@sims/sims-db";
import { DataSource } from "typeorm";
import { createFakeStudent } from "./student";

/**
 * Create fake student file upload object.
 * @param student entity.
 * @returns created studentFile object.
 */
export function createFakeStudentFileUpload(student?: Student): StudentFile {
  const studentFile = new StudentFile();
  studentFile.fileName = faker.system.fileName();
  studentFile.uniqueFileName =
    studentFile.fileName +
    faker.random.number(5) +
    "." +
    faker.system.fileType();
  studentFile.groupName = "Ministry communications";
  studentFile.mimeType = faker.system.mimeType();
  studentFile.fileContent = Buffer.from(faker.random.words(50), "utf-8");
  studentFile.student = student ?? createFakeStudent();
  studentFile.creator = { id: student?.user.id } as User;
  studentFile.fileOrigin = FileOriginType.Ministry;
  return studentFile;
}

/**
 * Save fake student file upload.
 * @param dataSource data source to persist studentFileUpload.
 * @param relations student entity relations.
 * @returns persisted studentFile.
 */
export async function saveFakeStudentFileUpload(
  dataSource: DataSource,
  relations?: { student: Student },
): Promise<StudentFile> {
  const studentFile = createFakeStudentFileUpload(relations?.student);
  const studentFileRepo = dataSource.getRepository(StudentFile);
  return studentFileRepo.save(studentFile);
}
