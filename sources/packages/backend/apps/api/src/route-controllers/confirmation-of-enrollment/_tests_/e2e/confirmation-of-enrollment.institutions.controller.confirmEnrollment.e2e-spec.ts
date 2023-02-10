// require("../../../../../../../env_setup");
// import { HttpStatus, INestApplication } from "@nestjs/common";
// import * as request from "supertest";
// import {
//   createFakeApplication,
//   createFakeDisbursementSchedule,
//   createFakeDisbursementValue,
//   createFakeEducationProgramOffering,
//   createFakeInstitutionLocation,
//   createFakeStudent,
//   createFakeStudentAssessment,
// } from "@sims/test-utils";
// import { DataSource, Repository } from "typeorm";
// import {
//   Application,
//   ApplicationStatus,
//   COEStatus,
//   DisbursementScheduleStatus,
//   DisbursementValueType,
//   EducationProgramOffering,
//   InstitutionUserTypes,
//   OfferingIntensity,
//   Student,
//   StudentAssessment,
//   User,
// } from "@sims/sims-db";
// import {
//   AESTGroups,
//   BEARER_AUTH_TYPE,
//   getAESTToken,
//   createTestingAppModule,
// } from "../../../../testHelpers";

// jest.setTimeout(60000);

// describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-confirmEnrollment", () => {
//   let app: INestApplication;
//   let appDataSource: DataSource;
//   let userRepo: Repository<User>;
//   let studentRepo: Repository<Student>;
//   let applicationRepo: Repository<Application>;
//   let studentAssessmentRepo: Repository<StudentAssessment>;
//   let educationProgramOfferingRepo: Repository<EducationProgramOffering>;

//   beforeAll(async () => {
//     const { nestApplication, dataSource } = await createTestingAppModule();
//     appDataSource = dataSource;
//     app = nestApplication;
//     userRepo = dataSource.getRepository(User);
//     studentRepo = dataSource.getRepository(Student);
//     applicationRepo = dataSource.getRepository(Application);
//     studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
//     educationProgramOfferingRepo = dataSource.getRepository(
//       EducationProgramOffering,
//     );
//   });

//   it("Should get all student notes types when student has notes and no note type filter was provided", async () => {
//     // Arrange
//     const { user, institution } = await saveInstitutionUser(appDataSource, InstitutionUserTypes.admin);
//     // Student.
//     const savedStudent = await studentRepo.save(createFakeStudent(user));
//     // Create and save application.
//     const fakeApplication = createFakeApplication({ student: savedStudent });
//     fakeApplication.applicationNumber = "COECONFIRM";
//     const savedApplication = await applicationRepo.save(fakeApplication);
//     // Institution Location
//     const fakeInstitutionLocation = createFakeInstitutionLocation(institution);
//     // Offering.
//     const fakeOffering = createFakeEducationProgramOffering({
//       institutionLocation: fakeInstitutionLocation,
//       auditUser: user,
//     });
//     fakeOffering.offeringIntensity = OfferingIntensity.fullTime;
//     const savedOffering = await educationProgramOfferingRepo.save(fakeOffering);

//     // Original assessment.
//     const fakeOriginalAssessment = createFakeStudentAssessment({
//       auditUser: user,
//     });
//     fakeOriginalAssessment.application = savedApplication;
//     // Original assessment - first disbursement.
//     const firstSchedule = createFakeDisbursementSchedule({
//       auditUser: user,
//       disbursementValues: [
//         createFakeDisbursementValue(
//           DisbursementValueType.CanadaLoan,
//           "CSLF",
//           1000,
//         ),
//         createFakeDisbursementValue(
//           DisbursementValueType.BCLoan,
//           "BCSL",
//           2000,
//           {
//             disbursedAmountSubtracted: 500,
//           },
//         ),
//       ],
//     });
//     firstSchedule.coeStatus = COEStatus.required;
//     firstSchedule.disbursementScheduleStatus =
//       DisbursementScheduleStatus.Pending;
//     fakeOriginalAssessment.disbursementSchedules = [firstSchedule];

//     fakeOriginalAssessment.offering = savedOffering;
//     const savedOriginalAssessment = await studentAssessmentRepo.save(
//       fakeOriginalAssessment,
//     );
//     savedApplication.currentAssessment = savedOriginalAssessment;
//     savedApplication.applicationStatus = ApplicationStatus.Completed;
//     await applicationRepo.save(savedApplication);
//     // Act/Assert
//     return request(app.getHttpServer())
//       .patch(
//         `/institutions/location/${}/confirmation-of-enrollment/disbursement-schedule/:disbursementScheduleId/confirm`,
//       )
//       .auth(
//         await getAESTToken(AESTGroups.BusinessAdministrators),
//         BEARER_AUTH_TYPE,
//       )
//       .expect(HttpStatus.OK)
//       .then((response) => {
//         expect(response.body).toHaveLength(2);
//       });
//   });

//   afterAll(async () => {
//     await app?.close();
//   });
// });
