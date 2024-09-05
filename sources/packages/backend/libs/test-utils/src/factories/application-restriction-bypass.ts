import {
  Application,
  ApplicationRestrictionBypass,
  Note,
  NoteType,
  Restriction,
  RestrictionActionType,
  RestrictionBypassBehaviors,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import { E2EDataSources } from "@sims/test-utils/data-source/e2e-data-source";
import { createFakeNote } from "@sims/test-utils/factories/note";
import { saveFakeStudentRestriction } from "@sims/test-utils/factories/student-restriction";
import { ArrayContains, FindOneOptions } from "typeorm";

/**
 * Create a fake application restrictions bypass.
 * All required relations entities must be already persisted to database.
 * @param relations dependencies:
 * - `application`: related student application.
 * - `studentRestriction`: active student restriction.
 * - `creationNote`: note for the bypass creation.
 * - `bypassCreatedBy`: user that created the bypass.
 * - `creator`: student user that created the request.
 * @returns a fake application restrictions bypass.
 */
export function createFakeApplicationRestrictionBypass(relations: {
  application: Application;
  studentRestriction: StudentRestriction;
  creationNote: Note;
  bypassCreatedBy: User;
  creator?: User;
}): ApplicationRestrictionBypass {
  const now = new Date();
  const bypass = new ApplicationRestrictionBypass();
  bypass.application = relations.application;
  bypass.studentRestriction = relations.studentRestriction;
  bypass.bypassBehavior = RestrictionBypassBehaviors.AllDisbursements;
  bypass.isActive = false;
  bypass.creationNote = relations.creationNote;
  bypass.bypassCreatedBy = relations.bypassCreatedBy;
  bypass.bypassCreatedDate = now;
  bypass.removalNote = undefined;
  bypass.bypassRemovedBy = undefined;
  bypass.bypassRemovedDate = undefined;
  bypass.creator = relations?.creator;
  bypass.createdAt = now;
  return bypass;
}

/**
 * Creates the necessary entities to have a student active restriction in place with an associated bypass.
 * @param db data source helper.
 * @param relations bypass relations.
 * - `application`: mandatory for bypass creation. Requires student and user to also be loaded.
 * - `studentRestriction`: optional student restriction. If not provided, one will be created.
 * - `creationNote`: optional creation note. If not provided, one will be created.
 * - `bypassCreatedBy`:
 * - `removalNote`: optional removal note. If not provided, one will be created only if the
 * {@link isRemoved} is set as true.
 * - `bypassRemovedBy`: optional removal user. Should be provided if {@link isRemoved} is set as true.
 * - `creator`: optional user to be se as record creator.
 * @param options bypass save options.
 * - `restrictionActionType`: when {@link studentRestriction} is not provided, a restriction will be
 * created and associated with the bypass using this parameter to define the restriction action.
 * - `restrictionCode`: when {@link studentRestriction} is not provided, a restriction will be
 * created and associated with the bypass using this parameter to define the restriction code.
 * {@link restrictionActionType} and {@link restrictionCode} are mutually exclusive and this one
 * take precedence since it will uniquely identify a restriction.
 * - `isRemoved`: if true, set the columns related to the bypass removal.
 * - `initialValues`: initial values to set to the {@link ApplicationRestrictionBypass} before saving it.
 * @returns the saved {@link ApplicationRestrictionBypass}.
 */
export async function saveFakeApplicationRestrictionBypass(
  db: E2EDataSources,
  relations: {
    application: Application;
    studentRestriction?: StudentRestriction;
    creationNote?: Note;
    bypassCreatedBy?: User;
    removalNote?: Note;
    bypassRemovedBy?: User;
    creator?: User;
  },
  options?: {
    restrictionActionType?: RestrictionActionType;
    restrictionCode?: string;
    isRemoved?: boolean;
    initialValues?: Partial<ApplicationRestrictionBypass>;
  },
): Promise<ApplicationRestrictionBypass> {
  const now = new Date();
  const bypass = new ApplicationRestrictionBypass();
  bypass.application = relations.application;
  bypass.bypassBehavior =
    options.initialValues?.bypassBehavior ??
    RestrictionBypassBehaviors.AllDisbursements;
  bypass.isActive = options.initialValues?.isActive ?? true;
  bypass.creator = relations?.creator;
  bypass.createdAt = now;
  // Define studentRestriction.
  if (!relations.studentRestriction) {
    // Find the restriction to ne associated with the student.
    const findOptions: FindOneOptions<Restriction> = options?.restrictionCode
      ? { where: { restrictionCode: options.restrictionCode } }
      : {
          where: {
            actionType: ArrayContains([options.restrictionActionType]),
          },
        };
    const restriction = await db.restriction.findOne(findOptions);
    // Create student restriction to stop disbursement.
    bypass.studentRestriction = await saveFakeStudentRestriction(
      db.dataSource,
      {
        student: relations.application.student,
        restriction,
      },
    );
  } else {
    bypass.studentRestriction = relations.studentRestriction;
  }
  // Define creationNote.
  bypass.creationNote = relations?.creationNote;
  if (!bypass.creationNote) {
    bypass.creationNote = await db.note.save(
      createFakeNote(NoteType.Application, {
        creator: relations?.creator,
      }),
    );
  }
  bypass.bypassCreatedBy = relations.bypassCreatedBy;
  bypass.bypassCreatedDate = now;
  if (options?.isRemoved) {
    // Define columns to set the bypass as removed.
    bypass.removalNote = relations?.removalNote;
    if (!bypass.removalNote) {
      bypass.removalNote = await db.note.save(
        createFakeNote(NoteType.Application, {
          creator: relations?.bypassRemovedBy,
        }),
      );
    }
    bypass.bypassRemovedBy = relations?.bypassRemovedBy;
    bypass.bypassRemovedDate = options?.initialValues.bypassRemovedDate ?? now;
  }
  return db.applicationRestrictionBypass.save(bypass);
}
