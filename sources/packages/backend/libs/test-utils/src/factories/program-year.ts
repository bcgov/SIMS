import * as faker from "faker";
import { ProgramYear } from "@sims/sims-db";

export function createFakeProgramYear(programYearPrefix?: number): ProgramYear {
  if (programYearPrefix === undefined) {
    programYearPrefix = 2022;
  }
  const startingYear = programYearPrefix;
  const endingYear = programYearPrefix + 1;
  const programYear = new ProgramYear();
  programYear.formName = `SFAA${startingYear}-${endingYear}`;
  programYear.programYear = `${startingYear}-${endingYear}`;
  programYear.programYearDesc = `Study starting between August 01, ${startingYear} and July 31, ${endingYear}`;
  programYear.active = true;
  programYear.parentFormName = `${programYear.formName}-parent`;
  programYear.partnerFormName = `${programYear.formName}-partner`;
  programYear.programYearPrefix = programYearPrefix.toString();
  programYear.maxLifetimeBCLoanAmount = faker.random.number(100000);
  return programYear;
}
