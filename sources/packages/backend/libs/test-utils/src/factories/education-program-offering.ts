import * as faker from "faker";
import { createFakeInstitutionLocation } from "./institution-location";
import { createFakeEducationProgram } from "./education-program";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingTypes,
  OfferingIntensity,
  User,
  OfferingStatus,
  Institution,
  StudyBreaksAndWeeks,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { E2EDataSources } from "@sims/test-utils/data-source/e2e-data-source";
import { OfferingYesNoOptions } from "apps/api/src/services";

export function createFakeEducationProgramOffering(
  relations: {
    auditUser: User;
    program?: EducationProgram;
    institution?: Institution;
    institutionLocation?: InstitutionLocation;
  },
  options?: {
    initialValues?: Partial<EducationProgramOffering>;
    programInitialValues?: Partial<EducationProgram>;
  },
): EducationProgramOffering {
  // Case an institution location is provided already associated with
  // an institution ensure that the relationship will be kept and
  // another institution will not be generated.
  const institution =
    relations?.institutionLocation?.institution ?? relations.institution;
  const offering = new EducationProgramOffering();
  offering.name = faker.random.word();
  offering.actualTuitionCosts = faker.datatype.number(1000);
  offering.programRelatedCosts = faker.datatype.number(1000);
  offering.mandatoryFees = faker.datatype.number(1000);
  offering.exceptionalExpenses = faker.datatype.number(1000);
  offering.offeringDelivered = "offeringDelivered";
  offering.lacksStudyBreaks = true;
  offering.educationProgram =
    relations?.program ??
    createFakeEducationProgram(
      {
        institution,
        auditUser: relations.auditUser,
      },
      {
        initialValues: options?.programInitialValues,
      },
    );
  offering.institutionLocation =
    relations?.institutionLocation ?? createFakeInstitutionLocation();
  offering.offeringIntensity =
    options?.initialValues?.offeringIntensity ?? OfferingIntensity.fullTime;
  offering.offeringType =
    options?.initialValues?.offeringType ?? OfferingTypes.Public;
  offering.yearOfStudy = 1;
  offering.courseLoad = 45;
  offering.isAviationOffering =
    options?.initialValues?.isAviationOffering ?? OfferingYesNoOptions.No;
  offering.aviationCredentialType =
    options?.initialValues?.aviationCredentialType ?? "endorsements";
  offering.hasOfferingWILComponent =
    options?.initialValues?.hasOfferingWILComponent ?? "no";
  offering.offeringWILType = options?.initialValues?.offeringWILType;
  offering.offeringDeclaration = true;
  offering.studyStartDate =
    options?.initialValues?.studyStartDate ??
    getISODateOnlyString(faker.date.recent(1));
  offering.studyEndDate =
    options?.initialValues?.studyEndDate ??
    getISODateOnlyString(faker.date.soon(30));
  offering.studyBreaks =
    options?.initialValues?.studyBreaks ??
    ({
      totalFundedWeeks: 16,
      totalDays: 210, // 30 offering weeks * 7 days,
    } as StudyBreaksAndWeeks);
  offering.offeringStatus =
    options?.initialValues?.offeringStatus ?? OfferingStatus.Approved;
  offering.parentOffering = options?.initialValues?.parentOffering ?? offering;
  offering.precedingOffering = options?.initialValues?.precedingOffering;
  return offering;
}

/**
 * Adds a new version for the given offering.
 * @param db E2E data sources.
 * @param offering offering to add a version for.
 * @param options add version options.
 * - `offeringStatus` offering status.
 * - `versionOfferingStatus` version offering status.
 * @returns offering and version offering.
 */
export async function addOfferingVersion(
  db: E2EDataSources,
  offering: EducationProgramOffering,
  options?: {
    offeringStatus?: OfferingStatus;
    versionOfferingStatus?: OfferingStatus;
  },
): Promise<{
  offering: EducationProgramOffering;
  versionOffering: EducationProgramOffering;
}> {
  const offeringStatus =
    options?.offeringStatus ?? OfferingStatus.ChangeOverwritten;
  const versionOfferingStatus =
    options?.versionOfferingStatus ?? OfferingStatus.Approved;
  if (!offering.id) {
    await db.educationProgramOffering.save(offering);
  }
  const versionOffering = createFakeEducationProgramOffering(
    {
      auditUser: offering.creator,
      program: offering.educationProgram,
      institution: offering.institutionLocation.institution,
      institutionLocation: offering.institutionLocation,
    },
    {
      initialValues: {
        offeringStatus: versionOfferingStatus,
        precedingOffering: offering,
        parentOffering: offering.parentOffering,
        name: offering.name,
      },
    },
  );
  offering.offeringStatus = offeringStatus;
  await db.educationProgramOffering.save([offering, versionOffering]);
  return { offering, versionOffering };
}
