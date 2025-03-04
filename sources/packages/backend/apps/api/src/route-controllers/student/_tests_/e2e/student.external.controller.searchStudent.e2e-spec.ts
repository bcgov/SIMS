import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  createFakeDisbursementValue,
  E2EDataSources,
  ensureProgramYearExists,
  saveFakeApplicationDisbursements,
  saveFakeSFASIndividual,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementValueType,
  FormYesNoOptions,
  FullTimeAssessment,
  OfferingIntensity,
  ProgramYear,
  RelationshipStatus,
  StudentAssessmentStatus,
  WorkflowData,
} from "@sims/sims-db";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  getExternalUserToken,
} from "../../../../testHelpers";
import {
  StudentSearchAPIInDTO,
  StudentSearchResultAPIOutDTO,
} from "../../models/student-external-search.dto";
import { In } from "typeorm";

describe("StudentExternalController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let currentProgramYear: ProgramYear;
  let oldProgramYear: ProgramYear;
  const endpoint = "/external/student";
  const VALID_SIN = "656173713";
  const searchPayload: StudentSearchAPIInDTO = {
    sin: VALID_SIN,
  };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // Get the current program year.
    currentProgramYear = await db.programYear
      .createQueryBuilder("py")
      .where("NOW() BETWEEN py.startDate AND py.endDate")
      .getOne();
    oldProgramYear = await ensureProgramYearExists(db, 2000);
  });

  beforeEach(async () => {
    // Set the sin validation of the used in tests to be invalid to not interfere with other tests.
    await db.sinValidation.update(
      {
        sin: VALID_SIN,
      },
      { isValidSIN: false },
    );
    // Get all applications for the student.
    const applications = await db.application.find({
      select: {
        id: true,
      },
      where: {
        student: { sinValidation: { sin: VALID_SIN } },
      },
    });
    // Set application status to overwritten to not interfere with other tests.
    await db.application.update(
      {
        id: In(applications.map((application) => application.id)),
      },
      { applicationStatus: ApplicationStatus.Overwritten },
    );
    // Remove the student from SFAS to not interfere with other tests.
    await db.sfasIndividual.delete({ sin: VALID_SIN });
  });

  it(
    "Should return student information from SIMS when the student with provided SIN exist in SIMS" +
      ` but not in SFAS and the student does not have any ${OfferingIntensity.fullTime} applications within past 2 program years.`,
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      const address = student.contactInfo.address;
      // Application from old program year.
      await saveFakeApplicationDisbursements(db.dataSource, {
        student,
        programYear: oldProgramYear,
      });

      const token = await getExternalUserToken();
      const expectedStudentServiceResult: StudentSearchResultAPIOutDTO = {
        isLegacy: false,
        givenNames: student.user.firstName,
        lastName: student.user.lastName,
        sin: student.sinValidation.sin,
        birthDate: student.birthDate,
        phoneNumber: student.contactInfo.phone,
        address: {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          provinceState: address.provinceState,
          country: address.country,
          postalCode: address.postalCode,
        },
        applications: [],
      };
      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(searchPayload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(expectedStudentServiceResult);
    },
  );

  it(
    "Should return student information from SIMS when the student with provided SIN exist in SFAS" +
      ` but not in SIMS and the student does not have any ${OfferingIntensity.fullTime} applications.`,
    async () => {
      // Arrange
      const legacyStudent = await saveFakeSFASIndividual(db.dataSource, {
        initialValues: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      const token = await getExternalUserToken();
      const expectedStudentServiceResult: StudentSearchResultAPIOutDTO = {
        isLegacy: true,
        givenNames: legacyStudent.firstName,
        lastName: legacyStudent.lastName,
        sin: legacyStudent.sin,
        birthDate: legacyStudent.birthDate,
        phoneNumber: legacyStudent.phoneNumber?.toString(),
        address: {
          addressLine1: legacyStudent.addressLine1,
          addressLine2: legacyStudent.addressLine2,
          city: legacyStudent.city,
          provinceState: legacyStudent.provinceState,
          country: legacyStudent.country,
          postalCode: legacyStudent.postalZipCode,
        },
        applications: [],
      };

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(searchPayload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(expectedStudentServiceResult);
    },
  );

  it(
    "Should return student information from SIMS when the student with provided SIN exist in both SFAS and SIMS" +
      ` and the student does not have any ${OfferingIntensity.fullTime} applications in both the systems.`,
    async () => {
      // Arrange
      // Create fake SIMS student.
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      // Create Fake SFAS Individual with same SIN as SIMS.
      await saveFakeSFASIndividual(db.dataSource, {
        initialValues: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      const address = student.contactInfo.address;
      const token = await getExternalUserToken();
      const expectedSIMSStudentSearchResult: StudentSearchResultAPIOutDTO = {
        isLegacy: false,
        givenNames: student.user.firstName,
        lastName: student.user.lastName,
        sin: student.sinValidation.sin,
        birthDate: student.birthDate,
        phoneNumber: student.contactInfo.phone,
        address: {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          provinceState: address.provinceState,
          country: address.country,
          postalCode: address.postalCode,
        },
        applications: [],
      };

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(searchPayload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(expectedSIMSStudentSearchResult);
    },
  );

  it(
    "Should return student and application information from SIMS when the student with provided SIN exist in SIMS" +
      ` but not in SFAS and the student has ${OfferingIntensity.fullTime} applications in current program year` +
      " and the student does not have any dependants.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          programYear: currentProgramYear,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              100,
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              100,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationData: { workflowName: "DUMMY" },
          currentAssessmentInitialValues: {
            assessmentData: {
              tuitionCost: 600,
              booksAndSuppliesCost: 500,
              exceptionalEducationCost: 400,
              livingAllowance: 300,
              secondResidenceCost: 0,
              childcareCost: 0,
              alimonyOrChildSupport: 0,
              transportationCost: 0,
              provincialAssessmentNeed: 1800,
            } as FullTimeAssessment,
            workflowData: {
              studentData: {
                citizenship: "canadianCitizen",
                taxReturnIncome: 1000,
                bcResident: FormYesNoOptions.Yes,
                relationshipStatus: RelationshipStatus.Single,
              },
              dmnValues: { livingCategory: "SIH" },
            } as WorkflowData,
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      );
      const address = student.contactInfo.address;
      const assessment = application.currentAssessment;
      const offering = assessment.offering;
      const location = application.location;
      const [disbursement] = assessment.disbursementSchedules;

      const token = await getExternalUserToken();
      const expectedStudentServiceResult: StudentSearchResultAPIOutDTO = {
        isLegacy: false,
        givenNames: student.user.firstName,
        lastName: student.user.lastName,
        sin: student.sinValidation.sin,
        birthDate: student.birthDate,
        phoneNumber: student.contactInfo.phone,
        address: {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          provinceState: address.provinceState,
          country: address.country,
          postalCode: address.postalCode,
        },
        applications: [
          {
            isLegacy: false,
            applicationNumber: application.applicationNumber,
            applicationStatus: ApplicationStatus.Assessment,
            cancelDate: null,
            immigrationStatus: "canadianCitizen",
            bcResidency: FormYesNoOptions.Yes,
            maritalStatus: "single",
            income: 1000,
            livingArrangement: "Home",
            estimatedTotalAward: 200,
            program: {
              startDate: offering.studyStartDate,
              endDate: offering.studyEndDate,
              // Total funded weeks set to 16 by default in factory.
              lengthInWeeks: 16,
              courseLoad: "FT",
            },
            institution: {
              locationCode: location.institutionCode,
              locationName: location.name,
              primaryContactFirstName: location.primaryContact.firstName,
              primaryContactLastName: location.primaryContact.lastName,
              primaryContactEmail: location.primaryContact.email,
              primaryContactPhone: location.primaryContact.phone,
            },
            costs: {
              tuition: 600,
              booksAndSupplies: 500,
              exceptionalExpenses: 400,
              livingAllowance: 300,
              secondResidence: 0,
              childCare: 0,
              alimony: 0,
              totalTransportation: 0,
              totalNeed: 1800,
            },
            disbursements: [
              {
                awardCode: "CSLP",
                awardAmount: 100,
                fundingDate: disbursement.disbursementDate,
                requestDate: null,
              },
              {
                awardCode: "BCAG",
                awardAmount: 100,
                fundingDate: disbursement.disbursementDate,
                requestDate: null,
              },
            ],
          },
        ],
      };
      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(searchPayload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect(expectedStudentServiceResult);
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
