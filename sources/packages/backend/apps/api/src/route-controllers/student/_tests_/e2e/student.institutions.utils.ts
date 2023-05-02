import {
  createFakeInstitutionLocation,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  InstitutionTokenTypes,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import { DataSource } from "typeorm";
import { Application, Student } from "@sims/sims-db";

/**
 * Save student application for College C
 * with a College C location.
 * @param dataSource
 * @returns student and application details with application location.
 */
export async function saveStudentApplicationForCollegeC(
  dataSource: DataSource,
): Promise<{ student: Student; collegeCApplication: Application }> {
  const student = await saveFakeStudent(dataSource);
  const { institution } = await getAuthRelatedEntities(
    dataSource,
    InstitutionTokenTypes.CollegeCUser,
  );
  const collegeCLocation = createFakeInstitutionLocation(institution);
  const application = await saveFakeApplication(dataSource, {
    student,
    institutionLocation: collegeCLocation,
  });
  return {
    student,
    collegeCApplication: application,
  };
}
