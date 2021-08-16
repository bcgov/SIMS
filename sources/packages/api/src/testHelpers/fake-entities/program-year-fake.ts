import { ProgramYear } from "../../database/entities";

export function createFakeProgramYear(): ProgramYear {
  const programYear = new ProgramYear();
  programYear.id = 2;
  programYear.formName = "SFAA2022-23";
  programYear.programYear = "2022-2023";
  programYear.programYearDesc =
    "Study starting between August 01, 2022 and July 31, 2023";
  programYear.active = true;
  return programYear;
}
