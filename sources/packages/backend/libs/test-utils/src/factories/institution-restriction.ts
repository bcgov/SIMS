import {
  EducationProgram,
  Institution,
  InstitutionLocation,
  InstitutionRestriction,
  Note,
  NoteType,
  Restriction,
  RestrictionType,
  User,
} from "@sims/sims-db";
import { createFakeNote, saveFakeInstitutionNotes } from "./note";
import { createFakeUser } from "./user";
import { E2EDataSources, RestrictionCode } from "@sims/test-utils";

/**
 * Create a fake institution restriction to be persisted.
 * @param dataSource Data source to persist student restriction.
 * @param relations Student restriction entity relations.
 * - `institution` Related institution.
 * - `program` Program associated with the institution.
 * - `location` Location associated with the institution.
 * - `restriction` Restriction associated with the institution.
 * - `restrictionNote` Note for restriction.
 * - `creator` Record creator.
 * @param options Options for institution restriction.
 * - `initialValues` option for specifying initial values of the institution restriction.
 * @returns Fake institution restriction to be persisted.
 */
export function createFakeInstitutionRestriction(
  relations: {
    institution: Institution;
    program?: EducationProgram;
    location?: InstitutionLocation;
    restriction: Restriction;
    restrictionNote?: Note;
    creator?: User;
  },
  options?: { initialValues: Partial<InstitutionRestriction> },
): InstitutionRestriction {
  const restriction = new InstitutionRestriction();
  restriction.institution = relations.institution;
  restriction.program = relations.program;
  restriction.location = relations.location;
  restriction.restriction = relations.restriction;
  restriction.restrictionNote = relations.restrictionNote;
  restriction.isActive = options?.initialValues?.isActive ?? true;
  restriction.creator = relations?.creator;
  return restriction;
}

/**
 * Saves a fake institution restriction.
 * @param dataSource DataSource for the application.
 * @param relations Entity relations.
 * - `institution` Related institution.
 * - `program` Program associated with the institution.
 * - `location` Location associated with the institution.
 * - `restriction` Restriction associated with the institution. If not provided, one will be created.
 * - `restrictionNote` Note for restriction.  If not provided, one will be created.
 * - `creator` Record creator.
 * @param options Options for institution restriction.
 * - `initialValues` option for specifying initial values of the institution restriction.
 * @returns Persisted fake institution restriction.
 */
export async function saveFakeInstitutionRestriction(
  db: E2EDataSources,
  relations: {
    institution: Institution;
    program?: EducationProgram;
    location?: InstitutionLocation;
    restriction: Restriction;
    restrictionNote?: Note;
    creator?: User;
  },
  options?: { initialValues: Partial<InstitutionRestriction> },
): Promise<InstitutionRestriction> {
  const [restrictionNote] = await saveFakeInstitutionNotes(
    db.dataSource,
    [
      createFakeNote(NoteType.Restriction),
      createFakeNote(NoteType.Restriction),
    ],
    relations.institution.id,
  );
  const user = relations?.creator ?? createFakeUser();
  if (!user.id) {
    await db.user.save(user);
  }
  const institutionRestriction = createFakeInstitutionRestriction(
    {
      ...relations,
      restrictionNote,
    },
    options,
  );
  return db.institutionRestriction.save(institutionRestriction);
}

/**
 * Gets the restriction by the restriction code and saves the institution restriction.
 * @param db Data sources for e2e tests.
 * @param restrictionCode Restriction code to find and then save the institution restriction.
 * @param relations Entity relations.
 * - `institution` Related institution.
 * - `program` Program associated with the institution.
 * - `location` Location associated with the institution.
 * @param options Options for institution restriction.
 * - `initialValues` option for specifying initial values of the institution restriction.
 * @returns The saved institution restriction.
 */
export async function findAndSaveInstitutionRestriction(
  db: E2EDataSources,
  restrictionCode: RestrictionCode,
  relations: {
    institution: Institution;
    program: EducationProgram;
    location: InstitutionLocation;
    creator: User;
  },
  options?: { initialValues: Partial<InstitutionRestriction> },
): Promise<InstitutionRestriction> {
  const restriction = await db.restriction.findOne({
    where: {
      restrictionCode,
      restrictionType: RestrictionType.Institution,
    },
  });
  return saveFakeInstitutionRestriction(
    db,
    {
      ...relations,
      restriction,
    },
    options,
  );
}
