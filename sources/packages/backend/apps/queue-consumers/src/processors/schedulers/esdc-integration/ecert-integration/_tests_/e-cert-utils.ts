import {
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";
import {
  createFakeDisbursementValue,
  createFakeMSFAANumber,
  E2EDataSources,
  MSFAAStates,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { In } from "typeorm";

/**
 * Load disbursement awards for further validations.
 * The method {@link awardAssert} can be used in conjunction with this.
 * @param dataSource application dataSource.
 * @param disbursementId disbursement id to have the awards loaded.
 * @param options load options.
 * - `valueCode` award value code to be filtered.
 * @returns disbursement awards.
 */
export async function loadAwardValues(
  dataSource: E2EDataSources,
  disbursementId: number,
  options?: {
    valueCode: string[];
  },
): Promise<DisbursementValue[]> {
  return dataSource.disbursementValue.find({
    select: {
      valueCode: true,
      valueAmount: true,
      effectiveAmount: true,
      restrictionAmountSubtracted: true,
      restrictionSubtracted: {
        id: true,
      },
    },
    relations: {
      restrictionSubtracted: true,
    },
    where: {
      disbursementSchedule: { id: disbursementId },
      valueCode: options?.valueCode.length ? In(options.valueCode) : undefined,
    },
  });
}

/**
 * Check the award updated values to ensure that they were updated as expected.
 * @param awards list of awards.
 * @param valueCode award code.
 * @param options method optional award values to be asserted.
 * - `valueAmount` eligible award value.
 * - `effectiveAmount` value calculated to be added to the e-Cert.
 * - `restrictionAmountSubtracted` amount subtracted from the eligible award
 * value due to a restriction.
 * @returns true if all assertions were successful.
 */
export function awardAssert(
  awards: DisbursementValue[],
  valueCode: string,
  options: {
    valueAmount?: number;
    effectiveAmount?: number;
    restrictionAmountSubtracted?: number;
  },
): boolean {
  const award = awards.find((award) => award.valueCode === valueCode);
  if (!award) {
    return false;
  }
  if (options.valueAmount && options.valueAmount !== award.valueAmount) {
    return false;
  }
  if (
    options.effectiveAmount &&
    options.effectiveAmount !== award.effectiveAmount
  ) {
    return false;
  }
  if (
    options.restrictionAmountSubtracted &&
    (options.restrictionAmountSubtracted !==
      award.restrictionAmountSubtracted ||
      !award.restrictionSubtracted.id)
  ) {
    // If a restriction is expected, a restriction id should also be present.
    return false;
  }
  return true;
}

/**
 * Load the disbursement schedules for the assessment.
 * @param dataSource application dataSource.
 * @param studentAssessmentId assessment id.
 * @returns disbursement schedules for the assessment.
 */
export async function loadDisbursementSchedules(
  dataSource: E2EDataSources,
  studentAssessmentId: number,
): Promise<DisbursementSchedule[]> {
  return dataSource.disbursementSchedule.find({
    select: {
      id: true,
      disbursementScheduleStatus: true,
    },
    where: {
      studentAssessment: {
        id: studentAssessmentId,
      },
    },
    order: { disbursementDate: "ASC" },
  });
}

/**
 * Creates the test data required for blocked disbursement.
 * @param db e2e data sources.
 * @param options options.
 * - `offeringIntensity` offering intensity.
 * - `isValidSIN` is student SIN valid.
 * - `disbursementValues` disbursement values.
 * - `msfaaState` MSFAA number approval state.
 * @returns student and disbursement.
 */
export async function createBlockedDisbursementTestData(
  db: E2EDataSources,
  options?: {
    offeringIntensity?: OfferingIntensity;
    isValidSIN?: boolean;
    disbursementValues?: DisbursementValue[];
    msfaaState?: MSFAAStates;
    firstDisbursementInitialValues?: Partial<DisbursementSchedule>;
  },
): Promise<{
  student: Student;
  disbursement: DisbursementSchedule;
}> {
  const offeringIntensity =
    options?.offeringIntensity ?? OfferingIntensity.partTime;
  const isValidSIN = options?.isValidSIN ?? false;
  const disbursementValues = options?.disbursementValues ?? [
    createFakeDisbursementValue(DisbursementValueType.CanadaLoan, "CSLP", 300),
  ];
  const msfaaState = options?.msfaaState ?? MSFAAStates.Signed;

  // Create a student.
  const student = await saveFakeStudent(db.dataSource, undefined, {
    sinValidationInitialValue: {
      isValidSIN,
    },
  });
  // Create MSFAA for the student.
  const msfaaNumber = await db.msfaaNumber.save(
    createFakeMSFAANumber(
      { student },
      {
        msfaaState,
        msfaaInitialValues: {
          offeringIntensity,
        },
      },
    ),
  );
  // Student application.
  const application = await saveFakeApplicationDisbursements(
    db.dataSource,
    {
      student,
      msfaaNumber,
      disbursementValues,
    },
    {
      offeringIntensity: offeringIntensity,
      applicationStatus: ApplicationStatus.Completed,
      firstDisbursementInitialValues: {
        coeStatus: COEStatus.completed,
        hasEstimatedAwards:
          options?.firstDisbursementInitialValues?.hasEstimatedAwards,
      },
    },
  );
  const [disbursement] = application.currentAssessment.disbursementSchedules;
  return {
    student,
    disbursement,
  };
}
