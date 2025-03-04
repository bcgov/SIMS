import { SFASApplication, SFASIndividual } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create fake SFAS application.
 * @param relations dependencies.
 * - `SFASIndividual` related SFAS individual.
 * @param options SFAS application options.
 * - `initialValues` SFAS application initial values.
 * @returns persisted SFAS application.
 */
export function createFakeSFASApplication(
  relations: { individual: SFASIndividual },
  options?: {
    initialValues?: Partial<SFASApplication>;
    isMarried?: boolean;
  },
): SFASApplication {
  const sfasApplication = new SFASApplication();
  sfasApplication.id = faker.datatype.number({
    min: 100000000,
    max: 999999999,
  });
  sfasApplication.programYearId = options?.initialValues?.programYearId;
  sfasApplication.startDate =
    options?.initialValues.startDate ??
    getISODateOnlyString(faker.date.past(18));
  sfasApplication.endDate =
    options?.initialValues.endDate ?? getISODateOnlyString(faker.date.past(18));
  sfasApplication.individual = relations.individual;
  sfasApplication.bslAward = options?.initialValues.bslAward ?? 20;
  sfasApplication.cslAward = options?.initialValues.cslAward ?? 20;
  sfasApplication.bcagAward = options?.initialValues.bcagAward ?? 0;
  sfasApplication.bgpdAward = options?.initialValues.bgpdAward ?? 0;
  sfasApplication.csfgAward = options?.initialValues.csfgAward ?? 0;
  sfasApplication.csgtAward = options?.initialValues.csgtAward ?? 0;
  sfasApplication.csgdAward = options?.initialValues.csgdAward ?? 0;
  sfasApplication.csgpAward = options?.initialValues.csgpAward ?? 0;
  sfasApplication.sbsdAward = options?.initialValues.sbsdAward ?? 0;
  sfasApplication.createdAt = faker.date.past(18);
  sfasApplication.updatedAt = faker.date.past(18);
  sfasApplication.extractedAt = faker.date.past(18);
  sfasApplication.applicationCancelDate =
    options?.initialValues?.applicationCancelDate ?? null;
  sfasApplication.applicationNumber =
    options?.initialValues?.applicationNumber ??
    faker.datatype.number({
      max: 9999999999,
      min: 1000000000,
    });
  sfasApplication.applicationStatusCode =
    options?.initialValues?.applicationStatusCode ??
    faker.random.alpha({ count: 4, upcase: true });
  sfasApplication.withdrawalDate = options?.initialValues?.withdrawalDate;
  sfasApplication.withdrawalReason = options?.initialValues?.withdrawalReason;
  sfasApplication.withdrawalActiveFlag =
    options?.initialValues?.withdrawalActiveFlag;
  sfasApplication.bcResidencyFlag =
    options?.initialValues?.bcResidencyFlag ?? "Y";
  sfasApplication.permanentResidencyFlag =
    options?.initialValues?.permanentResidencyFlag ?? "Y";
  sfasApplication.maritalStatus = options?.initialValues?.maritalStatus ?? "SI";
  sfasApplication.marriageDate = options?.initialValues?.marriageDate;
  sfasApplication.grossIncomePreviousYear =
    options?.initialValues?.grossIncomePreviousYear;
  sfasApplication.livingArrangements =
    options?.initialValues?.livingArrangements ?? "N";
  sfasApplication.institutionCode = options?.initialValues?.institutionCode;
  sfasApplication.assessedCostsTuition =
    options?.initialValues?.assessedCostsTuition;
  sfasApplication.assessedCostsBooksAndSupplies =
    options?.initialValues?.assessedCostsBooksAndSupplies;
  sfasApplication.assessedCostsExceptionalExpenses =
    options?.initialValues?.assessedCostsExceptionalExpenses;
  sfasApplication.assessedCostsLivingAllowance =
    options?.initialValues?.assessedCostsLivingAllowance;
  sfasApplication.assessedCostsChildCare =
    options?.initialValues?.assessedCostsChildCare;
  sfasApplication.assessedCostsExtraShelter =
    options?.initialValues?.assessedCostsExtraShelter;
  sfasApplication.assessedCostsAlimony =
    options?.initialValues?.assessedCostsAlimony;
  sfasApplication.assessedCostsLocalTransport =
    options?.initialValues?.assessedCostsLocalTransport;
  sfasApplication.assessedCostsReturnTransport =
    options?.initialValues?.assessedCostsReturnTransport;
  sfasApplication.assessedEligibleNeed =
    options?.initialValues?.assessedEligibleNeed;
  sfasApplication.educationPeriodWeeks =
    options?.initialValues?.educationPeriodWeeks;
  sfasApplication.courseLoad = options?.initialValues?.courseLoad ?? 100;
  if (options?.isMarried) {
    sfasApplication.maritalStatus =
      options?.initialValues?.maritalStatus ?? "MA";
    sfasApplication.marriageDate =
      options?.initialValues?.marriageDate ??
      getISODateOnlyString(faker.date.past(18));
  }
  return sfasApplication;
}
