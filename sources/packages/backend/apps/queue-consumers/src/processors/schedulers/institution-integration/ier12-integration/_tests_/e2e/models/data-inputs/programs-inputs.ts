import { IER12Program } from "./data-inputs.models";

export const PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE: IER12Program =
  {
    name: "Program name",
    credentialType: "undergraduateCertificate",
    fieldOfStudyCode: 1,
    cipCode: "12.1234",
    nocCode: "1234",
    sabcCode: "ADR1",
    institutionProgramCode: undefined,
    completionYears: "5YearsOrMore",
  };

export const PROGRAM_GRADUATE_DIPLOMA_WITH_INSTITUTION_PROGRAM_CODE: IER12Program =
  {
    name: "Program with long name to ensure the program name space of 75 characters is used",
    credentialType: "graduateDiploma",
    fieldOfStudyCode: 1,
    cipCode: "12.1234",
    nocCode: "1234",
    sabcCode: "ADR2",
    institutionProgramCode: "XYZ",
    completionYears: "5YearsOrMore",
  };
