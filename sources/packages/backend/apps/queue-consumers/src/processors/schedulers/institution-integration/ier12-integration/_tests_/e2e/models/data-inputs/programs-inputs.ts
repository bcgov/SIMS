import { IER12Program } from "./data-inputs.models";

export const PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE: IER12Program =
  {
    name: "Program",
    description: "Program description",
    credentialType: "undergraduateCertificate",
    fieldOfStudyCode: 1,
    cipCode: "12.1234",
    nocCode: "1234",
    sabcCode: "ADR2",
    institutionProgramCode: undefined,
    completionYears: "5YearsOrMore",
  };
