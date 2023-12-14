import { IER12Program } from "./data-inputs.models";

export const PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE: IER12Program =
  {
    name: "Program",
    description: "Program description",
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
    name: "Some Program With Description Too Long",
    // Added new line character expecting to be replaced during
    // file processing.
    description: "Some program with\n description too long",
    credentialType: "graduateDiploma",
    fieldOfStudyCode: 1,
    cipCode: "12.1234",
    nocCode: "1234",
    sabcCode: "ADR2",
    institutionProgramCode: "XYZ",
    completionYears: "5YearsOrMore",
  };
