import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  DisbursementValueType,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import { createFakeApplication } from "./application";
import { createFakeDisbursementSchedule } from "./disbursement-schedule";
import { createFakeDisbursementValue } from "./disbursement-value";
import { createFakeEducationProgramOffering } from "./education-program-offering";
import { createFakeStudent } from "./student";
import { createFakeStudentAssessment } from "./student-assessment";
import { createFakeUser } from "./user";

/**
 * Create and save to the database a disbursement record with all the dependencies.
 * @param dataSource manages the repositories to save the data.
 * @param relations dependencies.
 * @returns the created application and its dependencies including the disbursement
 * with the confirmation of enrollment data.
 */
export async function saveFakeApplicationCOE(
  dataSource: DataSource,
  relations?: {
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
    disbursementValues?: DisbursementValue[];
  },
  options?: {
    createSecondDisbursement: boolean;
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
  fakeApplication.applicationStatus = ApplicationStatus.Enrolment;
  const savedApplication = await applicationRepo.save(fakeApplication);
  // Original assessment.
  const fakeOriginalAssessment = createFakeStudentAssessment({
    auditUser: savedUser,
  });
  fakeOriginalAssessment.application = savedApplication;
  const disbursementSchedules: DisbursementSchedule[] = [];
  // Original assessment - first disbursement.
  const firstSchedule = createFakeDisbursementSchedule({
    auditUser: savedUser,
    disbursementValues: relations?.disbursementValues ?? [
      createFakeDisbursementValue(DisbursementValueType.CanadaLoan, "CSLF", 1),
    ],
  });
  firstSchedule.coeStatus = COEStatus.required;
  firstSchedule.disbursementScheduleStatus = DisbursementScheduleStatus.Pending;
  disbursementSchedules.push(firstSchedule);
  if (options?.createSecondDisbursement) {
    // Original assessment - second disbursement.
    const secondSchedule = createFakeDisbursementSchedule({
      auditUser: savedUser,
      disbursementValues: relations?.disbursementValues ?? [
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 1),
      ],
    });
    secondSchedule.coeStatus = COEStatus.required;
    secondSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Pending;
    // First schedule is created with the current date as default.
    // Adding 60 days to create some time between the first and second schedules.
    secondSchedule.disbursementDate = getISODateOnlyString(addDays(60));
    disbursementSchedules.push(secondSchedule);
  }
  fakeOriginalAssessment.disbursementSchedules = disbursementSchedules;
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
