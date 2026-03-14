/**
 * Form.io path names for various forms used in the system.
 */
export const FormNames = {
  EducationProgram: "educationprogram",
  ProgramInformationRequest: "programinformationrequest",
  StudentProfile: "studentprofile",
  DesignationAgreementDetails: "designationagreementdetails",
  InstitutionProfile: "institutionprofile",
  ReportScholasticStandingChange: "reportscholasticstandingchange",
  InstitutionLocation: "institutionlocation",
  InstitutionProfileCreation: "institutionprofilecreation",
  ExportFinancialReports: "exportfinancialreports",
  Application: "sfaa2023-24",
  // Student appeal form names.
  ModifiedIndependentAppeal: "modifiedindependentappeal",
  // Student application appeal forms.
  RoomAndBoardCostsAppeal: "roomandboardcostsappeal",
  StepParentWaiverAppeal: "stepparentwaiverappeal",
  // Change request appeal forms (legacy).
  StudentDependantsAppeal: "studentdependantsappeal",
  StudentAdditionalTransportationAppeal:
    "studentadditionaltransportationappeal",
  StudentDisabilityAppeal: "studentdisabilityappeal",
  StudentFinancialInformationAppeal: "studentfinancialinformationappeal",
  PartnerInformationAndIncomeAppeal: "partnerinformationandincomeappeal",
};

/**
 * Student only appeal forms path names.
 */
export const STUDENT_APPEAL_FORM_NAMES = [FormNames.ModifiedIndependentAppeal];

/**
 * Student application appeal forms path names.
 */
export const STUDENT_APPLICATION_APPEAL_FORM_NAMES = [
  FormNames.RoomAndBoardCostsAppeal,
  FormNames.StepParentWaiverAppeal,
];

/**
 * Student appeal form path names that were used for change request process (legacy SIMS appeals).
 */
export const CHANGE_REQUEST_APPEAL_FORMS = [
  FormNames.StudentDependantsAppeal,
  FormNames.StudentAdditionalTransportationAppeal,
  FormNames.StudentDisabilityAppeal,
  FormNames.StudentFinancialInformationAppeal,
  FormNames.PartnerInformationAndIncomeAppeal,
];

/**
 * Notification form type category labels used in ministry form submitted notifications
 * to classify the type of form or appeal being submitted.
 */
export const NOTIFICATION_FORM_TYPE = {
  ApplicationAppeal: "Application appeal",
  OtherAppeal: "Other appeal",
  StandardForm: "Standard form",
} as const;
