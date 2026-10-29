import { Student } from "@sims/sims-db";
import dayjs from "dayjs";

const FILE_DATE_FORMAT = "YYYYMMDD";

/**
 * Creates the expected SIN validation request file header.
 * @param fileDate date when the file was created.
 * @param batchNumber file sequence number.
 * @returns expected header line.
 */
export function createExpectedHeader(
  fileDate: Date,
  batchNumber: number,
): string {
  const batch = batchNumber.toString().padStart(6, "0");
  return `001${batch}${dayjs(fileDate).format(FILE_DATE_FORMAT)}BC${" ".repeat(71)}`;
}

/**
 * Creates the expected SIN validation request file record.
 * @param student student with the SIN validation.
 * @param options record options.
 * - `genderCode` expected gender code in the file.
 * @returns expected record line.
 */
export function createExpectedRecord(
  student: Student,
  options: { genderCode: string },
): string {
  const referenceIndex = student.sinValidation.id.toString().padStart(9, "0");
  // Names have a fixed width of 30 characters in the file.
  const firstName = (student.user.firstName ?? "").slice(0, 30).padEnd(30, " ");
  const lastName = student.user.lastName.slice(0, 30).padEnd(30, " ");
  const birthDate = student.birthDate.replaceAll("-", "");
  return `002${referenceIndex}${student.sinValidation.sin}${firstName}${lastName}${options.genderCode}${birthDate}`;
}

/**
 * Creates the expected SIN validation request file footer.
 * @param students students included in the file.
 * @returns expected footer line.
 */
export function createExpectedFooter(students: Student[]): string {
  const recordCount = students.length.toString().padStart(6, "0");
  const totalSINHash = students
    .reduce((hash, student) => hash + +student.sinValidation.sin, 0)
    .toString()
    .padStart(15, "0");
  return `999${recordCount}${totalSINHash}${" ".repeat(66)}`;
}
