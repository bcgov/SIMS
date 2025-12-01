import {
  EducationProgram,
  Institution,
  InstitutionLocation,
  InstitutionRestriction,
  Note,
  NoteType,
  Restriction,
  User,
} from "@sims/sims-db";
import { createFakeNote, saveFakeInstitutionNotes } from "./note";
import { E2EDataSources } from "@sims/test-utils";

/**
 * Create a fake institution restriction to be persisted.
 * @param dataSource Data source to persist institution restriction.
 * @param relations Institution restriction entity relations.
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
 * @param db Data sources for e2e tests.
 * @param relations Entity relations.
 * - `institution` Related institution.
 * - `program` Program associated with the institution.
 * - `location` Location associated with the institution.
 * - `restriction` Restriction associated with the institution. If not provided, one will be created.
 * - `restrictionNote` Note for restriction. If not provided, one will be created.
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
    [createFakeNote(NoteType.Restriction)],
    relations.institution.id,
  );
  const institutionRestriction = createFakeInstitutionRestriction(
    {
      ...relations,
      restrictionNote,
    },
    options,
  );
  return db.institutionRestriction.save(institutionRestriction);
}
