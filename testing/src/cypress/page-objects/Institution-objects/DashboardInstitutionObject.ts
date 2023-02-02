import BaseMethods from "./BaseMethods";

export enum CredentialTypes {
  UnderGraduateCertificate = "undergraduateCertificate",
  UnderGraduateDiploma = "undergraduateDiploma",
  UnderGraduateDegree = "undergraduateDegree",
  GraduateCertificate = "graduateCertificate",
  GraduateDiploma = "graduateDiploma",
  GraduateDegreeOrMasters = "graduateDegreeOrMasters",
  PostGraduateOrDoctorate = "postGraduateOrDoctorate",
  QualifyingStudies = "qualifyingStudies",
}

export enum ProgramLengthOptions {
  WeeksToLessThanYear = "12WeeksToLessThan1Year",
  OneToTwoYears = "1YearToLessThan2Years",
  TwoToThreeYears = "2YearsToLessThan3Years",
  ThreeToFourYears = "3YearsToLessThan4Years",
  FourToFiveYears = "4YearsToLessThan5Years",
  FiveOrMoreYears = "5YearsOrMore",
}

export enum RegulatoryBodyOptions {
  PTIB = "ptib",
  DQAB = "dqab",
  ITA = "ita",
  ICBC = "icbc",
}

export enum EntranceRequirementsOptions {
  HighSchoolMinimum = "minHighSchool",
  MinimumAge19Years = "hasMinimumAge",
  RequirementsByInstitution = "requirementsByInstitution",
  RequirementsByBCITA = "requirementsByBCITA",
}

export enum ProgramIntensityOptions {
  Yes = "Full Time and Part Time",
  No = "Full Time",
}

export enum ProgramDeliveryOptions {
  OnSite = "deliveredOnSite",
  Online = "deliveredOnline",
}

export enum CourseLoadCalculationOptions {
  CreditBased = "credit",
  HoursBased = "hours",
}

export enum IncludeMinimum20InstructionalHours {
  Yes = "yes",
  No = "no",
}

export enum IncludeMinimum15InstructionalHours {
  Yes = "yes",
  No = "no",
}

export enum IsAviationProgram {
  Yes = "yes",
  No = "no",
}

export enum DeliveredOnlineAlsoOnsiteOptions {
  Yes = "yes",
  No = "no",
}

export enum EslEligibilityOptions {
  lessThanTwenty = "lessThan20",
  TwentyOrMore = "20OrMore",
}

export enum JointInstitutionOptions {
  Yes = "yes",
  No = "no",
}

export enum JointDesignatedInstitution {
  Yes = "yes",
  No = "no",
}

export enum WILComponentOptions {
  Yes = "yes",
  No = "no",
}

export enum WILApprovalOptions {
  Yes = "yes",
  No = "no",
}

export enum WILProgramEligibilityOptions {
  Yes = "yes",
  No = "no",
}

export enum HasTravelOptions {
  Yes = "yes",
  No = "no",
}

export enum TravelProgramEligibilityOptions {
  Yes = "yes",
  No = "no",
}

export enum HasInternationalExchangeOptions {
  Yes = "yes",
  No = "no",
}

export enum HasInternationalExchangeProgramEligibilityOptions {
  Yes = "yes",
  No = "no",
}

export default class DashboardInstitutionObject extends BaseMethods {
  institutionLandingPage() {
    return this.getElementByCyId("institutionWelcomePage");
  }

  clickOnSideBar(location: string, menuItem: string) {
    cy.get("[data-cy='institutionSideBar']")
      .get(".v-list-item-title")
      .contains(`${location}`)
      .click()
      .parentsUntil(".v-list-group")
      .get(".v-list-item-title")
      .contains(`${menuItem}`)
      .click();
  }

  manageInstitutionProfileHeader() {
    return this.getElementByCyId("manageProfileHeader");
  }

  manageInstitutionMyProfileHeader() {
    return this.getElementByCyId("institutionUserProfileHeader");
  }

  manageInstitutionButton() {
    return this.getElementByCyId("manageInstitutions");
  }

  myProfileButton() {
    return this.getElementByCyId("myProfile");
  }

  settingButton() {
    return this.getElementByCyId("settings");
  }

  homeButton() {
    return this.getElementByCyId("institutionHome");
  }

  iconButton() {
    return this.getElementByCyId("settings");
  }

  institutionProgramsHeader() {
    return this.getElementByCyId("programsHeader");
  }

  viewProgramButton() {
    return this.getElementByCyId("viewProgram");
  }

  institutionSearchInputBox() {
    return this.getElementByCyId("searchBox").clear();
  }

  createInstitutionProgram() {
    return this.getElementByCyId("createProgram");
  }

  institutionProgramName() {
    return this.getElementByCyId("programName");
  }

  institutionProgramCIPInputText() {
    return this.getElementByCyId("cipCode");
  }

  institutionProgramCredential() {
    return this.getElementByCyId("programCredential");
  }

  institutionProgramStatus() {
    return this.getElementByCyId("programStatus");
  }

  institutionProgramStudyPeriods() {
    return this.getElementByCyId("programStudyPeriods");
  }

  selectCredentialType(credentialType: CredentialTypes) {
    this.getElementByCyId("credentialType").select(credentialType);
  }

  selectCredentialTypeDropDown() {
    return this.getElementByCyId("credentialType");
  }

  selectProgramLength(programLength: ProgramLengthOptions) {
    this.getElementByCyId("completionYears").select(programLength);
  }

  selectProgramLengthDropDown() {
    return this.getElementByCyId("completionYears");
  }

  selectRegulatoryBody(regulatoryBody: RegulatoryBodyOptions) {
    this.getElementByCyId("regulatoryBody").select(regulatoryBody);
  }

  selectRegulatoryBodyDropDown() {
    return this.getElementByCyId("regulatoryBody");
  }

  studentPartTimeBasisRadioButton(checkBoxToSelect: ProgramIntensityOptions) {
    this.selectCheckBox("programIntensity", checkBoxToSelect);
  }

  deliverabilityOnsiteRadioButton(checkBoxToSelect: ProgramDeliveryOptions) {
    this.selectCheckBox("programDeliveryTypes", checkBoxToSelect);
  }

  deliveredOnlineAlsoRadioButton(
    checkBoxToSelect: DeliveredOnlineAlsoOnsiteOptions
  ) {
    this.selectCheckBox("deliveredOnlineAlsoOnsite", checkBoxToSelect);
  }

  courseLoadCalculationRadioButton(
    checkBoxToSelect: CourseLoadCalculationOptions
  ) {
    this.selectCheckBox("courseLoadCalculation", checkBoxToSelect);
  }

  includeMinimum20InstructionalHoursRadioButton(
    checkBoxToSelect: IncludeMinimum20InstructionalHours
  ) {
    this.selectCheckBox("minHoursWeek", checkBoxToSelect);
  }

  includeMinimum15InstructionalHoursRadioButton(
    checkBoxToSelect: IncludeMinimum15InstructionalHours
  ) {
    this.selectCheckBox("minHoursWeekAvi", checkBoxToSelect);
  }

  isAviationProgramRadioButton(checkBoxToSelect: IsAviationProgram) {
    this.selectCheckBox("isAviationProgram", checkBoxToSelect);
  }

  entranceRequirementsRadioButton(
    checkBoxToSelect: EntranceRequirementsOptions
  ) {
    this.selectCheckBox("entranceRequirements", checkBoxToSelect);
  }

  eslEligibilityRadioButton(checkBoxToSelect: EslEligibilityOptions) {
    this.selectCheckBox("eslEligibility", checkBoxToSelect);
  }

  hasJointInstitutionRadioButton(checkBoxToSelect: JointInstitutionOptions) {
    this.selectCheckBox("hasJointInstitution", checkBoxToSelect);
  }

  hasJointDesignatedInstitutionRadioButton(
    checkBoxToSelect: JointDesignatedInstitution
  ) {
    this.selectCheckBox("hasJointDesignatedInstitution", checkBoxToSelect);
  }

  hasWILComponentRadioButton(checkBoxToSelect: WILComponentOptions) {
    this.selectCheckBox("hasWILComponent", checkBoxToSelect);
  }

  isWILApprovedRadioButton(checkBoxToSelect: WILApprovalOptions) {
    this.selectCheckBox("isWILApproved", checkBoxToSelect);
  }

  hasTravelRadioButton(checkBoxToSelect: HasTravelOptions) {
    this.selectCheckBox("hasTravel", checkBoxToSelect);
  }

  hasTravelEligibilityRadioButton(
    checkBoxToSelect: TravelProgramEligibilityOptions
  ) {
    this.selectCheckBox("travelProgramEligibility", checkBoxToSelect);
  }

  hasInternationalExchangeRadioButton(
    checkBoxToSelect: HasInternationalExchangeOptions
  ) {
    this.selectCheckBox("hasIntlExchange", checkBoxToSelect);
  }

  hasInternationalExchangeEligibilityRadioButton(
    checkBoxToSelect: HasInternationalExchangeProgramEligibilityOptions
  ) {
    this.selectCheckBox("intlExchangeProgramEligibility", checkBoxToSelect);
  }

  fieldOfStudyCode() {
    return this.getElementByCyId("fieldOfStudyCode");
  }

  programDeclarationCheckBox() {
    return this.getElementByCyId("programDeclaration");
  }

  programSubmitButton() {
    return this.getElementByCyId("primaryFooterButton");
  }

  invalidFormatErrorText() {
    return cy.contains("Invalid format");
  }

  incorrectFormatErrorText() {
    return cy.contains("Incorrect Format");
  }

  noProgramsYetText() {
    return cy.contains("You don't have programs yet");
  }

  dashboardWelcomeMessage() {
    return cy.contains("Welcome!");
  }

  dashboardStartMessage() {
    return cy.contains("Get started here");
  }

  dashboardHelpMessage() {
    return cy.contains("Need help?");
  }

  helpCenter() {
    return cy.contains("Help Centre");
  }

  programsButton() {
    return cy.contains("Programs");
  }

  logOutButton() {
    return cy.contains("Log Out");
  }

  allLocationsText() {
    return cy.contains("All locations");
  }

  locationButton() {
    return cy.get(".v-list-group div:first");
  }

  manageLocationsText() {
    return cy.contains("Manage Locations");
  }
}
