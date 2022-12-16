import DashboardInstitutionObject, {
  CredentialTypes,
} from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageUsersObject from "../../page-objects/Institution-objects/ManageUsersObject";
import LocationProgramObject from "../../page-objects/Institution-objects/LocationProgramObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import ProgramDetailViewObject from "../../page-objects/Institution-objects/ProgramDetailViewObject";
import data from "../../e2e/data/institution/manage-location.json";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const locationProgramObject = new LocationProgramObject();
const institutionHelperActions = new InstitutionHelperActions();
const programDetailViewObject = new ProgramDetailViewObject();

describe("Location Program", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.homeButton().click();
    dashboardInstitutionObject.clickOnSideBar("Vancouver", "Programs");
  });

  it("Verify that user redirect to location program page", () => {
    dashboardInstitutionObject.institutionProgramsHeader().should("be.visible");
    cy.url().should("contain", "/location-programs");
  });

  it("Verify that user when searched for incorrect programs will return correct results", () => {
    dashboardInstitutionObject
      .institutionSearchInputBox()
      .type("Dummy")
      .type("{enter}");
    dashboardInstitutionObject.noProgramsYetText().should("be.visible");
  });

  it("Verify that user when searched for programs will display correct results", () => {
    dashboardInstitutionObject
      .institutionSearchInputBox()
      .type("Testing")
      .type("{enter}");
    dashboardInstitutionObject
      .institutionProgramName()
      .should("have.length", 2);
  });

  it("Verify that all programs are should have mandatory columns displayed", () => {
    dashboardInstitutionObject.institutionSearchInputBox().type("{enter}");
    dashboardInstitutionObject.institutionProgramName().should("be.visible");
    dashboardInstitutionObject
      .institutionProgramCIPInputText()
      .should("be.visible");
    dashboardInstitutionObject
      .institutionProgramCredential()
      .should("be.visible");
    dashboardInstitutionObject
      .institutionProgramStudyPeriods()
      .should("be.visible");
    dashboardInstitutionObject.institutionProgramStatus().should("be.visible");
  });

  it("Verify that user is able to view the detail of the program", () => {
    dashboardInstitutionObject
      .institutionSearchInputBox()
      .type("Offering1")
      .type("{enter}");
    dashboardInstitutionObject.viewProgramButton().click();
    programDetailViewObject.programDetailHeader().should("be.visible");
    programDetailViewObject.programName().should("be.visible");
    programDetailViewObject.programCode().should("be.visible");
    programDetailViewObject.programCredentialType().should("be.visible");
    programDetailViewObject.programDescription().should("be.visible");
    programDetailViewObject.programNOCCode().should("be.visible");
    programDetailViewObject.programStatus().should("be.visible");
  });
});

describe("Location Program", () => {
  // Create
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.homeButton().click();
    dashboardInstitutionObject.clickOnSideBar("Vancouver", "Programs");
    dashboardInstitutionObject.createInstitutionProgram().click();
  });

  it("Verify that program name is a mandatory field", () => {
    dashboardInstitutionObject.verifyThatFieldShouldNotBeEmpty(
      dashboardInstitutionObject.institutionProgramName(),
      "Program name"
    );
  });

  it("Verify that program name should not accept more than 100 chars", () => {
    dashboardInstitutionObject.verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
      dashboardInstitutionObject.institutionProgramName(),
      "Program name",
      100
    );
  });

  it("Verify that CIP is a mandatory field", () => {
    dashboardInstitutionObject.verifyThatFieldShouldNotBeEmpty(
      dashboardInstitutionObject.institutionProgramName(),
      "Program name"
    );
  });

  it("Verify that CIP field only accepts the valid format", () => {
    data.invalidData.CIP.forEach((data) => {
      dashboardInstitutionObject
        .institutionProgramCIPInputText()
        .clear()
        .type(data);
      dashboardInstitutionObject.invalidFormatErrorText().should("be.visible");
    });
  });

  it("Verify that NOC field only accepts the valid format", () => {
    data.invalidData.NOC.forEach((data) => {
      dashboardInstitutionObject
        .institutionProgramCIPInputText()
        .clear()
        .type(data);
      dashboardInstitutionObject
        .incorrectFormatErrorText()
        .should("be.visible");
    });
  });

  it("Verify that SABC field only accepts the valid format", () => {
    data.invalidData.SABC.forEach((data) => {
      dashboardInstitutionObject
        .institutionProgramCIPInputText()
        .clear()
        .type(data);
      dashboardInstitutionObject
        .incorrectFormatErrorText()
        .should("be.visible");
    });
  });

  it("Verify that all credential types exist", () => {
    Object.values(CredentialTypes).forEach((credentialType) => {
      dashboardInstitutionObject.selectCredentialType(credentialType);
    });
  });

  it("Verify that without filling mandatory fields, proper error message must be displayed", () => {
    locationProgramObject
      .percentageOfProgramESLErrorMessage()
      .should("be.visible");
    locationProgramObject
      .programOfferedJointlyErrorMessage()
      .should("be.visible");
    locationProgramObject
      .programWILComponentErrorMessage()
      .should("be.visible");
    locationProgramObject.fieldTripErrorMessage().should("be.visible");
    locationProgramObject
      .internationalExchangeErrorMessage()
      .should("be.visible");
    locationProgramObject.declarationErrorMessage().should("be.visible");
  });

  it.only("Verify that all credential types exist", () => {
    dashboardInstitutionObject.studentPartTimeBasisRadioButton();
  });
});
