import {
  EducationProgram,
  EducationProgramConfiguration,
  Institution,
  InstitutionLocation,
  InstitutionRestriction,
  Note,
  NoteType,
  Restriction,
  User,
} from "@sims/sims-db";
import { createFakeNote, saveFakeInstitutionNotes } from "./note";
import {
  createFakeEducationProgram,
  createFakeInstitution,
  createFakeInstitutionLocation,
  createFakeUser,
  E2EDataSources,
  getMostRecentEducationProgramConfiguration,
} from "@sims/test-utils";

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
  options?: { initialValues?: Partial<InstitutionRestriction> },
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
 * - `restriction` Restriction associated with the institution. If not provided, one will be created.
 * - `institution` Related institution.
 * - `program` Program associated with the institution.
 * - `programConfiguration` Program configuration associated with the program. If not provided, the most recent configuration will be used.
 * - `location` Location associated with the institution.
 * - `restrictionNote` Note for restriction. If not provided, one will be created.
 * - `creator` Record creator.
 * @param options Options for institution restriction.
 * - `initialValues` option for specifying initial values of the institution restriction.
 * - `createProgram` option to create a program for the institution and assign to the institution restriction.
 * - `createLocation` option to create a location for the institution and assign to the institution restriction.
 * @returns Persisted fake institution restriction.
 */
export async function saveFakeInstitutionRestriction(
  db: E2EDataSources,
  relations: {
    restriction: Restriction;
    institution?: Institution;
    program?: EducationProgram;
    programConfiguration?: EducationProgramConfiguration;
    location?: InstitutionLocation;
    restrictionNote?: Note;
    creator?: User;
  },
  options?: {
    initialValues?: Partial<InstitutionRestriction>;
    createProgram?: boolean;
    createLocation?: boolean;
  },
): Promise<InstitutionRestriction> {
  const creator = relations.creator ?? (await db.user.save(createFakeUser()));
  const institution =
    relations.institution ??
    (await db.institution.save(createFakeInstitution()));
  const [restrictionNote] = await saveFakeInstitutionNotes(
    db.dataSource,
    [createFakeNote(NoteType.Restriction)],
    institution.id,
    creator,
  );
  let program = relations.program;
  let location = relations.location;
  if (!program && options?.createProgram) {
    let programConfiguration = relations?.programConfiguration;
    if (!programConfiguration) {
      programConfiguration = await getMostRecentEducationProgramConfiguration({
        db,
      });
    }
    program = await db.educationProgram.save(
      createFakeEducationProgram({
        auditUser: creator,
        programConfiguration,
        institution,
      }),
    );
  }
  if (!location && options?.createLocation) {
    location = await db.institutionLocation.save(
      createFakeInstitutionLocation({ institution }),
    );
  }
  const institutionRestriction = createFakeInstitutionRestriction(
    {
      restriction: relations.restriction,
      institution,
      program,
      location,
      restrictionNote: relations.restrictionNote ?? restrictionNote,
      creator: relations.creator ?? creator,
    },
    options,
  );
  return db.institutionRestriction.save(institutionRestriction);
}
