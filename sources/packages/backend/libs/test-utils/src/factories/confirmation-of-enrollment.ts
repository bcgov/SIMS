import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValue,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { createFakeApplication } from "./application";
import { createFakeDisbursementSchedule } from "./disbursement-schedule";
import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeStudent } from "./student";
import { createFakeStudentAssessment } from "./student-assessment";
import { createFakeUser } from "./user";

export async function saveFakeApplicationCOE(
  dataSource: DataSource,
  relations?: {
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
    disbursementValues?: DisbursementValue[];
  },
): Promise<Application> {
  const userRepo = dataSource.getRepository(User);
  const studentRepo = dataSource.getRepository(Student);
  const applicationRepo = dataSource.getRepository(Application);
  const studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
  const offeringRepo = dataSource.getRepository(EducationProgramOffering);
  // User
  const savedUser = await userRepo.save(createFakeUser());
  // Student.
  const savedStudent = await studentRepo.save(createFakeStudent(savedUser));
  // Create and save application.
  const fakeApplication = createFakeApplication({ student: savedStudent });
  const savedApplication = await applicationRepo.save(fakeApplication);
  // Original assessment.
  const fakeOriginalAssessment = createFakeStudentAssessment({
    auditUser: savedUser,
  });
  fakeOriginalAssessment.application = savedApplication;
  // Original assessment - first disbursement.
  const firstSchedule = createFakeDisbursementSchedule({
    auditUser: savedUser,
    disbursementValues: relations?.disbursementValues,
  });
  firstSchedule.coeStatus = COEStatus.required;
  firstSchedule.disbursementScheduleStatus = DisbursementScheduleStatus.Pending;
  fakeOriginalAssessment.disbursementSchedules = [firstSchedule];
  // Offering.
  const fakeOffering = createFakeEducationProgramOffering({
    institution: relations?.institution,
    institutionLocation: relations?.institutionLocation,
    auditUser: savedUser,
  });
  fakeOffering.offeringIntensity = OfferingIntensity.fullTime;
  const savedOffering = await offeringRepo.save(fakeOffering);
  fakeOriginalAssessment.offering = savedOffering;
  const savedOriginalAssessment = await studentAssessmentRepo.save(
    fakeOriginalAssessment,
  );
  savedApplication.currentAssessment = savedOriginalAssessment;
  savedApplication.applicationStatus = ApplicationStatus.Enrolment;
  return applicationRepo.save(savedApplication);
}
