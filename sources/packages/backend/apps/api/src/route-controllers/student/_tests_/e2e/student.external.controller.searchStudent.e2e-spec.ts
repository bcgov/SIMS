import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  createFakeDisbursementValue,
  createFakeInstitutionLocation,
  createFakeSFASApplicationDependant,
  createFakeSFASApplicationDisbursement,
  E2EDataSources,
  ensureProgramYearExists,
  saveFakeApplicationDisbursements,
  saveFakeSFASIndividual,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationData,
  ApplicationStatus,
  DisbursementValueType,
  FormYesNoOptions,
  FullTimeAssessment,
  OfferingIntensity,
  ProgramYear,
  RelationshipStatus,
  SFASApplication,
  SFASIndividual,
  Student,
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
import { createFakeSFASApplication } from "@sims/test-utils/factories/sfas-application";

describe("StudentExternalController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let currentProgramYear: ProgramYear;
  let currentLegacyProgramYearId: number;
  let oldProgramYear: ProgramYear;
  let oldLegacyProgramYearId: number;
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
    currentLegacyProgramYearId = +currentProgramYear.programYear.replace(
      "-",
      "",
    );
    oldProgramYear = await ensureProgramYearExists(db, 2000);
    oldLegacyProgramYearId = +oldProgramYear.programYear.replace("-", "");
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
    // Set application status to Edited to not interfere with other tests.
    await db.application.update(
      {
        id: In(applications.map((application) => application.id)),
      },
      { applicationStatus: ApplicationStatus.Edited },
    );
    // Remove the SFAS data to not interfere with other tests.
    await db.sfasIndividual.delete({ sin: VALID_SIN });
    await db.sfasApplication.delete({ programYearId: currentProgramYear.id });
    await db.sfasApplicationDisbursement.delete({});
    await db.sfasApplicationDependant.delete({});
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
      " and the student has one or more dependants.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      const application = await createStudentApplicationSearchData(student, {
        hasDependants: true,
      });

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
            dependants: [{ fullName: "Kid one", birthDate: "2017-12-06" }],
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
                awardCode: "CSLF",
                awardAmount: 100,
                fundingDate: disbursement.disbursementDate,
                requestDate: null,
              },
              {
                awardCode: "BCSL",
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

  it(
    "Should return student information from SIMS and application information from SIMS and SFAS when the student with provided SIN exist in SIMS" +
      ` and in SFAS and the student has ${OfferingIntensity.fullTime} applications in current program year` +
      " and the student does not have any dependants.",
    async () => {
      // Arrange
      // Create student and application data.
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: VALID_SIN },
        includeAddressLine2: true,
      });
      const application = await createStudentApplicationSearchData(student);
      const address = student.contactInfo.address;
      const assessment = application.currentAssessment;
      const offering = assessment.offering;
      const location = application.location;
      const [disbursement] = assessment.disbursementSchedules;

      // Create legacy data.
      const individual = await saveFakeSFASIndividual(db.dataSource, {
        initialValues: { student },
      });
      const sfasApplication = await createLegacyStudentApplicationSearchData(
        individual,
        {
          institutionCode: location.institutionCode,
        },
      );
      // Create an application for same individual from old program year.
      // This application is expected to be ignored in the search result.
      await createLegacyStudentApplicationSearchData(individual, {
        institutionCode: location.institutionCode,
        legacyProgramYearId: oldLegacyProgramYearId,
      });
      const [sfasApplicationDisbursement] = sfasApplication.disbursements;

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
                awardCode: "CSLF",
                awardAmount: 100,
                fundingDate: disbursement.disbursementDate,
                requestDate: null,
              },
              {
                awardCode: "BCSL",
                awardAmount: 100,
                fundingDate: disbursement.disbursementDate,
                requestDate: null,
              },
            ],
          },
          {
            isLegacy: true,
            applicationNumber: sfasApplication.applicationNumber.toString(),
            applicationStatus: sfasApplication.applicationStatusCode,
            cancelDate: null,
            withdrawalDate: null,
            withdrawalReason: null,
            withdrawalActiveFlag: null,
            bcResidency: "Y",
            legacyPermanentResident: "Y",
            maritalStatus: "SI",
            legacyMaritalDate: null,
            income: 1000,
            livingArrangement: "Away",
            estimatedTotalAward: 200,
            dependants: [],
            program: {
              startDate: sfasApplication.startDate,
              endDate: sfasApplication.endDate,
              lengthInWeeks: 16,
              courseLoad: "100",
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
                awardCode: "BSL",
                awardAmount: 100,
                fundingDate: sfasApplicationDisbursement.fundingDate,
                requestDate: sfasApplicationDisbursement.dateIssued,
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

  it(
    "Should return student and application information from SFAS when the student with provided SIN exist in SFAS" +
      ` and does not exist in SIMS and the student has ${OfferingIntensity.fullTime} applications in current program year` +
      " ignoring the applications from old program years and the student does has one or more dependants.",
    async () => {
      // Arrange
      const location = await db.institutionLocation.save(
        createFakeInstitutionLocation(),
      );
      // Create legacy data.
      const individual = await saveFakeSFASIndividual(db.dataSource, {
        initialValues: { sin: VALID_SIN },
      });
      const sfasApplication = await createLegacyStudentApplicationSearchData(
        individual,
        {
          institutionCode: location.institutionCode,
          hasDependants: true,
        },
      );
      const [sfasApplicationDisbursement] = sfasApplication.disbursements;
      // Create an application for same individual from old program year.
      // This application is expected to be ignored in the search result.
      await createLegacyStudentApplicationSearchData(individual, {
        institutionCode: location.institutionCode,
        legacyProgramYearId: oldLegacyProgramYearId,
      });

      const token = await getExternalUserToken();
      const expectedStudentServiceResult: StudentSearchResultAPIOutDTO = {
        isLegacy: true,
        givenNames: individual.firstName,
        lastName: individual.lastName,
        sin: VALID_SIN,
        birthDate: individual.birthDate,
        phoneNumber: individual.phoneNumber?.toString(),
        address: {
          addressLine1: individual.addressLine1,
          addressLine2: individual.addressLine2,
          city: individual.city,
          provinceState: individual.provinceState,
          country: individual.country,
          postalCode: individual.postalZipCode,
        },
        applications: [
          {
            isLegacy: true,
            applicationNumber: sfasApplication.applicationNumber.toString(),
            applicationStatus: sfasApplication.applicationStatusCode,
            cancelDate: null,
            withdrawalDate: null,
            withdrawalReason: null,
            withdrawalActiveFlag: null,
            bcResidency: "Y",
            legacyPermanentResident: "Y",
            maritalStatus: "SI",
            legacyMaritalDate: null,
            income: 1000,
            livingArrangement: "Away",
            estimatedTotalAward: 200,
            dependants: [{ fullName: "Kid one", birthDate: "2017-12-06" }],
            program: {
              startDate: sfasApplication.startDate,
              endDate: sfasApplication.endDate,
              lengthInWeeks: 16,
              courseLoad: "100",
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
                awardCode: "BSL",
                awardAmount: 100,
                fundingDate: sfasApplicationDisbursement.fundingDate,
                requestDate: sfasApplicationDisbursement.dateIssued,
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

  it("Should throw not fond error when the student with provided SIN does not exist in either SIMS or SFAS.", async () => {
    const token = await getExternalUserToken();
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Student not found.",
        error: "Not Found",
      });
  });

  /**
   * Create student application search data.
   * @param student student.
   * @param options related options.
   * - `hasDependants` whether the student has dependants.
   * - `isLivingAway` whether the student is living away.
   * - `isMarried` whether the student is married.
   * @returns application search data.
   */
  async function createStudentApplicationSearchData(
    student: Student,
    options?: {
      hasDependants?: boolean;
      isLivingAway?: boolean;
      isMarried?: boolean;
    },
  ): Promise<Application> {
    const fakeApplicationData: ApplicationData = { workflowName: "DUMMY" };
    const fullTimeAssessmentData = {
      tuitionCost: 600,
      booksAndSuppliesCost: 500,
      exceptionalEducationCost: 400,
      livingAllowance: 300,
      secondResidenceCost: 0,
      childcareCost: 0,
      alimonyOrChildSupport: 0,
      transportationCost: 0,
      provincialAssessmentNeed: 1800,
    } as FullTimeAssessment;
    const workflowData = {
      studentData: {
        citizenship: "canadianCitizen",
        taxReturnIncome: 1000,
        bcResident: FormYesNoOptions.Yes,
        relationshipStatus: RelationshipStatus.Single,
      },
      dmnValues: { livingCategory: "SIH" },
    } as WorkflowData;
    // Update the fake data based on the options.
    if (options?.hasDependants) {
      fakeApplicationData.dependants = [
        {
          fullName: "Kid one",
          dateOfBirth: "2017-12-06",
          declaredOnTaxes: "yes",
          attendingPostSecondarySchool: "no",
        },
      ];
    }
    if (options?.isLivingAway) {
      workflowData.dmnValues.livingCategory = "SDA";
    }
    if (options?.isMarried) {
      workflowData.studentData.relationshipStatus = RelationshipStatus.Married;
    }
    return saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
        programYear: currentProgramYear,
        firstDisbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.CanadaLoan,
            "CSLF",
            100,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCSL",
            100,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationData: fakeApplicationData,
        currentAssessmentInitialValues: {
          assessmentData: fullTimeAssessmentData,
          workflowData,
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
  }

  /**
   * Create legacy application search data.
   * @param individual legacy student.
   * @param options related options.
   * - `legacyProgramYearId` program year id.
   * - `institutionCode` whether the student is married.
   * - `hasDependants` whether the student has dependants.
   * @returns application search data.
   */
  async function createLegacyStudentApplicationSearchData(
    individual: SFASIndividual,
    options?: {
      legacyProgramYearId?: number;
      institutionCode?: string;
      hasDependants?: boolean;
    },
  ): Promise<SFASApplication> {
    const sfasApplication = createFakeSFASApplication(
      { individual },
      {
        initialValues: {
          programYearId:
            options?.legacyProgramYearId ?? currentLegacyProgramYearId,
          grossIncomePreviousYear: 1000,
          bslAward: 100,
          cslAward: 100,
          courseLoad: 100,
          educationPeriodWeeks: 16,
          assessedCostsTuition: 600,
          assessedCostsBooksAndSupplies: 500,
          assessedCostsExceptionalExpenses: 400,
          assessedCostsLivingAllowance: 300,
          assessedCostsExtraShelter: 0,
          assessedCostsChildCare: 0,
          assessedCostsAlimony: 0,
          assessedCostsLocalTransport: 0,
          assessedCostsReturnTransport: 0,
          assessedEligibleNeed: 1800,
          institutionCode: options?.institutionCode,
        },
      },
    );
    await db.sfasApplication.save(sfasApplication);
    const sfasApplicationDisbursement = createFakeSFASApplicationDisbursement({
      sfasApplication,
    });
    await db.sfasApplicationDisbursement.save(sfasApplicationDisbursement);
    sfasApplication.disbursements = [sfasApplicationDisbursement];
    if (options?.hasDependants) {
      const sfasApplicationDependant = createFakeSFASApplicationDependant(
        {
          sfasApplication,
        },
        {
          initialValues: {
            dependantName: "Kid one",
            dependantBirthDate: "2017-12-06",
          },
        },
      );
      db.sfasApplicationDependant.save(sfasApplicationDependant);
      sfasApplication.dependants = [sfasApplicationDependant];
    }
    return sfasApplication;
  }

  afterAll(async () => {
    await app?.close();
  });
});
