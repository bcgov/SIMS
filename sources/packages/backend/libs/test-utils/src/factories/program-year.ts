import { ProgramYear } from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";

/**
 * Creates a program year.
 * @param programYearPrefix first year in the program to be used
 * as a reference for the program year name and start/end dates.
 * @returns the created program year ready to be saved.
 */
export function createFakeProgramYear(programYearPrefix?: number): ProgramYear {
  if (programYearPrefix === undefined) {
    programYearPrefix = 2022;
  }
  const startingYear = programYearPrefix;
  const endingYear = programYearPrefix + 1;
  const programYear = new ProgramYear();
  programYear.formName = `SFAA${startingYear}-${endingYear}`;
  programYear.programYear = `${startingYear}-${endingYear}`;
  programYear.programYearDesc = `My first day of classes starts between August 01, ${startingYear} and July 31, ${endingYear}`;
  programYear.active = true;
  programYear.parentFormName = `${programYear.formName}-parent`;
  programYear.partnerFormName = `${programYear.formName}-partner`;
  programYear.programYearPrefix = programYearPrefix.toString();
  programYear.maxLifetimeBCLoanAmount = 50000;
  programYear.startDate = `${startingYear}-08-01`;
  programYear.endDate = `${endingYear}-07-31`;
  return programYear;
}

/**
 * Ensure that a program year exists, checking by its name.
 * If it does not exists create a default using {@link createFakeProgramYear}
 * and save it.
 * @param db e2e data sources.
 * @param programYearPrefix program year prefix, for instance, a prefix 2000
 * would create a program year 2000-2001.
 * @returns program year with the prefix.
 */
export async function ensureProgramYearExists(
  db: E2EDataSources,
  programYearPrefix: number,
): Promise<ProgramYear> {
  const fakeProgramYear = createFakeProgramYear(programYearPrefix);
  const existingProgramYear = await db.programYear.findOneBy({
    programYear: fakeProgramYear.programYear,
  });
  if (existingProgramYear) {
    return existingProgramYear;
  }
  return db.programYear.save(fakeProgramYear);
}
