import { ProgramYear } from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";

export function createFakeProgramYear(programYearPrefix?: number): ProgramYear {
  if (programYearPrefix === undefined) {
    programYearPrefix = 2022;
  }
  const startingYear = programYearPrefix;
  const endingYear = programYearPrefix + 1;
  const programYear = new ProgramYear();
  programYear.formName = `SFAA${startingYear}-${endingYear}`;
  programYear.programYear = `${startingYear}-${endingYear}`;
  programYear.programYearDesc = `Study starting between September 1st, ${startingYear} and August 31st, ${endingYear}`;
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
  return await db.programYear.save(fakeProgramYear);
}
