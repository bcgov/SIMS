import {
  ApplicationData,
  Institution,
  Application,
  ApplicationStatus,
  OfferingIntensity,
  FullTimeAssessment,
  DisbursementScheduleStatus,
  Student,
} from "@sims/sims-db";
import {
  addDays,
  getISODateOnlyString,
  getPSTPDTDateTime,
} from "@sims/utilities";
import {
  E2EDataSources,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";

export async function createApplicationsByInstitutionDataSetup(
  db: E2EDataSources,
  options: {
    student: Student;
    institution: Institution;
    originalSubmissionDate?: Date;
  },
): Promise<Application> {
  const originalSubmissionDate = options?.originalSubmissionDate ?? new Date();
  const studyStartDate = getISODateOnlyString(
    addDays(30, originalSubmissionDate),
  );
  const studyEndDate = getISODateOnlyString(
    addDays(60, originalSubmissionDate),
  );
  const previousApplication = await saveFakeApplicationDisbursements(
    db.dataSource,
    { student: options.student, institution: options.institution },
    {
      applicationInitialValues: {
        submittedDate: originalSubmissionDate,
        applicationStatus: ApplicationStatus.Edited,
        data: {
          studystartDate: studyStartDate,
          studyendDate: studyEndDate,
          selectedOffering: 1,
          studentNumber: "1234567",
        } as ApplicationData,
      },
      currentAssessmentInitialValues: {
        assessmentDate: addDays(1, originalSubmissionDate),
        assessmentData: {
          totalAssessmentNeed: 1000,
          totalAssessedCost: 2000,
        } as FullTimeAssessment,
      },
    },
  );
  const currentApplication = await saveFakeApplicationDisbursements(
    db.dataSource,
    {
      student: options.student,
      institution: options.institution,
      parentApplication: previousApplication,
      precedingApplication: previousApplication,
    },
    {
      applicationInitialValues: {
        applicationStatus: ApplicationStatus.Completed,
        submittedDate: addDays(15, originalSubmissionDate),
        applicationNumber: previousApplication.applicationNumber,
        data: {
          studystartDate: studyStartDate,
          studyendDate: studyEndDate,
          selectedOffering: 4,
        } as ApplicationData,
      },
      currentAssessmentInitialValues: {
        assessmentDate: addDays(2, originalSubmissionDate),
        assessmentData: {
          totalAssessmentNeed: 2000,
          totalAssessedCost: 3000,
        } as FullTimeAssessment,
      },
    },
  );
  currentApplication.versions = [currentApplication, previousApplication];
  return currentApplication;
}

/**
 * Build Applications by Institution report data.
 * @param application application to generate the expected report record.
 * @returns report data.
 */
export function buildApplicationsByInstitutionData(
  application: Application,
): Record<string, string | number> {
  const assessmentData = application.currentAssessment.assessmentData;
  const savedOffering = application.currentAssessment.offering;
  const savedEducationProgram = savedOffering.educationProgram;
  const savedInstitution = application.location.institution;
  const savedLocation = application.location;
  const savedStudent = application.student;
  const savedUser = savedStudent.user;
  const disbursed = application.versions
    .flatMap(
      (applicationVersion) => applicationVersion.studentAssessments ?? [],
    )
    .flatMap(
      (studentAssessment) => studentAssessment.disbursementSchedules ?? [],
    )
    .some(
      (disbursementSchedule) =>
        disbursementSchedule.disbursementScheduleStatus ===
        DisbursementScheduleStatus.Sent,
    );
  return {
    "Student First Name": savedUser.firstName,
    "Student Last Name": savedUser.lastName,
    SIN: savedStudent.sinValidation.sin,
    "Student Number": application.studentNumber ?? "",
    "Institution Operating Name": savedInstitution.operatingName,
    Country: savedInstitution.country ?? "",
    Province: savedInstitution.province ?? "",
    Classification: savedInstitution.classification ?? "",
    "Organization Status": savedInstitution.organizationStatus ?? "",
    "Location Name": savedLocation.name,
    "Application Number": application.applicationNumber,
    "Original Submission": getPSTPDTDateTime(
      application.parentApplication.submittedDate,
    ),
    "Last Submission": getPSTPDTDateTime(application.submittedDate),
    "Assessment Date": getISODateOnlyString(
      application.currentAssessment.assessmentDate,
    ),
    "Application Status": application.applicationStatus,
    Disbursed: disbursed ? "Yes" : "No",
    "Study Intensity": savedOffering.offeringIntensity,
    "Program Name": savedEducationProgram.name,
    "Program Credential Type": savedEducationProgram.credentialType,
    "CIP Code": savedEducationProgram.cipCode,
    "Offering Name": savedOffering.name,
    "Study Start Date": savedOffering.studyStartDate,
    "Study End Date": savedOffering.studyEndDate,
    "Total Assistance": (application.offeringIntensity ===
    OfferingIntensity.fullTime
      ? (assessmentData as FullTimeAssessment).totalAssessedCost
      : assessmentData.totalAssessmentNeed
    ).toString(),
  };
}
