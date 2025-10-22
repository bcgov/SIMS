export const FormNames = {
  EducationProgram: "educationprogram",
  ProgramInformationRequest: "programinformationrequest",
  StudentProfile: "studentProfile",
  DesignationAgreementDetails: "designationagreementdetails",
  InstitutionProfile: "institutionprofile",
  ReportScholasticStandingChange: "reportscholasticstandingchange",
  InstitutionLocation: "institutionlocation",
  InstitutionProfileCreation: "institutionprofilecreation",
  ExportFinancialReports: "exportfinancialreports",
  Application: "SFAA2023-24",
  // Student appeal form names.
  ModifiedIndependentAppeal: "modifiedIndependentAppeal",
  // Student application appeal forms.
  RoomAndBoardCostsAppeal: "roomAndBoardCostsAppeal",
  // Change request appeal forms (legacy).
  StudentDependantsAppeal: "studentdependantsappeal",
  StudentAdditionalTransportationAppeal:
    "studentadditionaltransportationappeal",
  StudentDisabilityAppeal: "studentdisabilityappeal",
  StudentFinancialInformationAppeal: "studentfinancialinformationappeal",
  PartnerInformationAndIncomeAppeal: "partnerinformationandincomeappeal",
};

/**
 * Student only appeal forms.
 */
export const STUDENT_APPEAL_FORM_NAMES = [FormNames.ModifiedIndependentAppeal];

/**
 * Student application appeal forms.
 */
export const STUDENT_APPLICATION_APPEAL_FORM_NAMES = [
  FormNames.RoomAndBoardCostsAppeal,
];

/**
 * Student appeal form that were used for change request process before 2025-26 program year.
 */
export const CHANGE_REQUEST_APPEAL_FORMS = [
  FormNames.StudentDependantsAppeal,
  FormNames.StudentAdditionalTransportationAppeal,
  FormNames.StudentDisabilityAppeal,
  FormNames.StudentFinancialInformationAppeal,
  FormNames.PartnerInformationAndIncomeAppeal,
];
