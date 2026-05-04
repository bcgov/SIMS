/**
 * Methods like setup and default are part of the K6 life cycle.
 * @see https://k6.io/docs/using-k6/test-lifecycle
 * The exported options are part of the K6 configuration.
 * @see https://k6.io/docs/using-k6/k6-options
 */
import { check, sleep } from "k6";
import { loadTestPostCall } from "../../utils/load-test-api/load-test-api";
import { getLoadTestGatewayCredentials } from "../../utils/load-test-api/load-test-api-creds";
import { Options } from "k6/options";
import execution from "k6/execution";
import {
  patchStudentAPICall,
  getStudentCredentials,
} from "../../utils/sims-api";
import { UserPasswordCredential } from "../../utils/auth";
import { E2E_TEST_STUDENT_USERNAME } from "../../../config.env";

/**
 * Load test number of iterations to run.
 * Can be overridden via k6 -e ITERATIONS=<n>.
 */
const ITERATIONS = parseInt(__ENV.ITERATIONS || "500");
/**
 * Virtual users to run load test.
 * Please ensure that the number of virtual users
 * must always be less than the iterations.
 * Can be overridden via k6 -e VIRTUAL_USERS=<n>.
 */
const VIRTUAL_USERS = Math.min(
  parseInt(__ENV.VIRTUAL_USERS || "15"),
  ITERATIONS,
);

/**
 * Per-iteration data returned by the gateway setup endpoint.
 */
interface ApplicationSetupData {
  applicationId: number;
  offeringId: number;
  programId: number;
  locationId: number;
  programYearId: number;
}

interface SetupData {
  setupItems: ApplicationSetupData[];
  studentCredentials: UserPasswordCredential;
}

/**
 * Load all the required draft applications to be submitted during
 * the load test execution.
 * @returns setup data.
 */
export function setup(): SetupData {
  const gatewayCredentials = getLoadTestGatewayCredentials();
  const response = loadTestPostCall(
    `application-submission/setup/${ITERATIONS}`,
    gatewayCredentials,
    { payload: { studentUserName: E2E_TEST_STUDENT_USERNAME } },
  );
  const setupItems = response.json() as unknown as ApplicationSetupData[];
  return { setupItems, studentCredentials: getStudentCredentials() };
}

export const options: Options = {
  scenarios: {
    submitApplication: {
      executor: "shared-iterations",
      vus: VIRTUAL_USERS,
      iterations: ITERATIONS,
      maxDuration: "1h",
    },
  },
};

/**
 * Test scenario to be executed as many times as defined by the test options.
 * Part of the K6 life cycle.
 * @param setupData setup data returned by setup method.
 */
export default function (setupData: SetupData) {
  const { applicationId, offeringId, programId, locationId, programYearId } =
    setupData.setupItems[execution.scenario.iterationInTest];
  const payload = {
    associatedFiles: [] as string[],
    programYearId: Number(programYearId),
    data: {
      ...APPLICATION_SUBMISSION_DATA,
      selectedOffering: offeringId,
      selectedProgram: programId,
      selectedLocation: locationId,
    },
  };
  const submitResponse = patchStudentAPICall(
    `api/students/application/${applicationId}/submit`,
    setupData.studentCredentials,
    payload,
  );
  check(submitResponse, {
    "Submitted with success": (r) => r.status === 200,
  });
  sleep(1);
}

/**
 * Full-time student financial aid application data payload for the submit
 * endpoint. Aligned with the 2026-27 form schema. The selectedOffering,
 * selectedProgram, and selectedLocation fields are overridden per-iteration
 * with IDs returned from the gateway setup.
 */
const APPLICATION_SUBMISSION_DATA = {
  workflowName: "assessment-gateway-v2",
  applicationExceptionsStrategy: "verify-unique-application-exceptions",
  maxIncome: "100000000",
  isChangeRequestApplication: false,
  isProgramSectionReadOnly: false,
  allowBetaInstitutionsOnly: false,
  selectedLocation: 14,
  mySchoolIsNotListed: false,
  studentNumber: "",
  programYear: "2026",
  calculatedTaxYear: 2025,
  selectedProgramDesc: {
    id: 211,
    name: "Computer Sciences",
    description: "Computer science description",
    credentialType: "graduateDiploma",
    credentialTypeToDisplay: "Graduate Diploma",
    deliveryMethod: "Onsite",
  },
  studyPeriodMaxDays: "365",
  currentTaxYear: "2026",
  programPersistentProperties: [
    "selectedLocation",
    "mySchoolIsNotListed",
    "selectedProgram",
    "myProgramNotListed",
    "programName",
    "programDescription",
    "studystartDate",
    "studyendDate",
    "selectedOffering",
    "myStudyPeriodIsntListed",
    "studentNumber",
    "pirResubmissionDate",
  ],
  selectedLocationProgramRestrictions: [] as unknown[],
  isSelectedLocationProgramRestricted: false,
  pirResubmissionDate: "",
  studentGivenNames: "MATT",
  studentDateOfBirth: "Nov 25 1985",
  studentHomeAddress: "123 Humboldt St, Victoria, BC, V9V1V1, canada",
  studentEmail: "simsfive@test.ca",
  studentLastName: "FRANKY",
  studentGender: "man",
  studentPhoneNumber: "7789221234",
  disabilityStatus: "Not requested",
  studentProfileDisabilityStatusValue: "Not requested",
  studentProfileModifiedIndependentStatusValue: "Not requested",
  maxUploadedFiles: 25,
  studentInfoConfirmed: true,
  citizenship: "canadianCitizen",
  relationshipStatus: "single",
  indigenousStatus: "no",
  youthInCare: "no",
  everDeclaredBankruptcy: "no",
  outOfHighSchoolFor4Years: "no",
  whenDidYouGraduateOrLeaveHighSchool: "2023-10-03",
  fulltimelabourForce: "no",
  duringStudyCoopPaidWork: "no",
  hasDependents: "no",
  dependants: [] as unknown[],
  applicationPDPPDStatus: "no",
  addTrustContactToContactSABC: "no",
  parentInformationStatus: "required",
  dependantstatus: "dependant",
  restrictions: [] as unknown[],
  roiInformation: [
    {
      firstName: "",
      lastName: "",
      relationshipWithThisContact: "",
    },
  ],
  craConsent: true,
  childSupport: "no",
  scholarshipsReceived: "no",
  bcIncomeassistanceforDisabilities: "no",
  governmentFunding: "no",
  nonGovernmentFunding: "no",
  parentvoluntaryContributions: "no",
  livingAtHome: "no",
  considerCostToRelocateToDifferentCity: "no",
  additionalTransportRequested: "no",
  studentAidBcConsent: true,
  applicationId: "",
  applicationStatus: "",
  selectedLocationName: "Victoria College",
  selectedProgramName: "Computer Sciences",
  myProgramNotListed: { programnotListed: false },
  myStudyPeriodIsntListed: { offeringnotListed: false },
  programYearStartDate: "2026-08-01",
  programYearEndDate: "2027-07-31",
  fulltimeMonthsOfStudy: 0,
  parentsDeceased: "no",
  estrangedFromParents: "no",
  parentbcResident: "yes",
  taxReturnIncome: 15000,
  parents: [
    {
      parentFullName: "Test Parent",
      parentIsAbleToReport: "no",
    },
  ],
  isReadOnly: false,
  isFulltimeAllowed: true,
  applicationOfferingIntensityValue: "Full Time",
  citizenshipForBCResidencyApplicationException: {} as Record<string, unknown>,
  parentsResidencyApplicationException: {} as Record<string, unknown>,
};
