import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageDesignationsObject from "../../page-objects/Institution-objects/ManageDesignationsObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import ManageInstitutionObject, {
  SideBarMenuItems,
} from "../../page-objects/Institution-objects/ManageInstitutionObject";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const manageDesignationObject = new ManageDesignationsObject();
const institutionHelperActions = new InstitutionHelperActions();
const manageInstitutionObject = new ManageInstitutionObject();

describe("Manage Designations", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageDesignation);
  });

  it("Verify that user is navigated to Designation agreements page when clicked on Manage Designations", () => {
    manageDesignationObject
      .designationAgreementsHeaderText()
      .should("be.visible");
    cy.url().should("contain", "/manage-designation");
  });

  it("Verify the list of details for the designation agreements", () => {
    //Validates using number of designation status
    manageDesignationObject.designationStatus().should("have.length", 1);
  });

  it("Verify that user is able to view the designation agreement", () => {
    manageDesignationObject
      .viewDesignationButton()
      .should("be.visible")
      .click();
    manageDesignationObject.viewDesignationText().should("be.visible");
    manageDesignationObject
      .manageDesignationsBackButton()
      .should("be.visible")
      .click();
    manageDesignationObject
      .designationAgreementsHeaderText()
      .should("be.visible");
  });
});

describe("Manage Designation", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageDesignation);
    manageDesignationObject.viewDesignationButton().click();
  });

  it("Verify that user is able to navigate back from view Designation to manage designation page", () => {
    manageDesignationObject
      .manageDesignationsBackButton()
      .should("be.visible")
      .click();
    manageDesignationObject
      .designationAgreementsHeaderText()
      .should("be.visible");
  });

  it("Verify that heading, labels and hyperlinks are properly displayed ", () => {
    manageDesignationObject
      .designationDetailsText()
      .scrollIntoView()
      .should("be.visible");
    manageDesignationObject
      .designatedLocationsText()
      .scrollIntoView()
      .should("be.visible");
    manageDesignationObject
      .signingOfficersText()
      .scrollIntoView()
      .should("be.visible");
    manageDesignationObject
      .agreementDocumentationText()
      .scrollIntoView()
      .should("be.visible");
    manageDesignationObject
      .bcPolicyManualHyperlinkText()
      .scrollIntoView()
      .should("be.visible")
      .should(
        "have.attr",
        "href",
        "https://studentaidbc.ca/sites/all/files/school-officials/policy_manual.pdf"
      );
    manageDesignationObject
      .administrationManualHyperlinkText()
      .scrollIntoView()
      .should("be.visible")
      .should(
        "have.attr",
        "href",
        "https://studentaidbc.ca/sites/all/files/school-officials/admin_manual.pdf"
      );
    manageDesignationObject
      .informationSharingAgreementHyperlinkText()
      .scrollIntoView()
      .should("be.visible")
      .should(
        "have.attr",
        "href",
        "https://studentaidbc.ca/sites/all/files/school-officials/Schedule_D_Designation_Agreement.pdf"
      );
    manageDesignationObject
      .designationAcknowledgementsText()
      .scrollIntoView()
      .should("be.visible");
  });

  it('Verify that user redirect manage locations when clicked on "manage locations" hyperlink', () => {
    manageDesignationObject.manageLocationsHyperlink().click({ force: true });
    manageInstitutionObject.manageLocations().should("be.visible");
    cy.url().should("contain", "/manage-locations");
  });

  it('Verify that user redirect manage users when clicked on "manage users" hyperlink', () => {
    manageDesignationObject.manageUsersHyperlink().click({ force: true });
    manageInstitutionObject.manageUsers().should("be.visible");
    cy.url().should("contain", "/manage-users");
  });
});

describe("Manage Designation", () => {
  //TODO Intentionally skipped until we have control over the data that is created. Since we can have one `request for designation` in progress
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageInstitutionObject.clickOnSideBar(SideBarMenuItems.ManageDesignation);
    manageDesignationObject.requestDesignationButton().click();
  });

  it("Clicking on manage locations should navigate to locations page", () => {
    manageDesignationObject.manageLocationsHyperlink().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
  });

  it("Clicking on cancel should navigate back to manage designations page", () => {
    manageDesignationObject.cancelAgreementButton().scrollIntoView().click();
    manageDesignationObject
      .designationAgreementsHeaderText()
      .should("be.visible");
  });

  it.skip("Request a new designation", () => {
    cy.url().should("contain", "manage-designation/request");
    manageDesignationObject.requestForDesignationCheckBox().check();
    manageDesignationObject.eligibilityOfficerName().type("Test User I");
    manageDesignationObject.eligibilityOfficerPosition().type("SIMS Officer I");
    manageDesignationObject
      .eligibilityOfficerEmail()
      .type("testuser@testuser.ca");
    manageDesignationObject.eligibilityOfficerPhone().type("1234567890");

    manageDesignationObject.enrolmentOfficerName().type("Test User II");
    manageDesignationObject.enrolmentOfficerPosition().type("SIMS Officer II");
    manageDesignationObject
      .enrolmentOfficerEmail()
      .type("testuser2@testuser.ca");
    manageDesignationObject.enrolmentOfficerPhone().type("1234567890");
    manageDesignationObject.scheduleACheckbox().click();
    manageDesignationObject.scheduleBCheckbox().click();
    manageDesignationObject.scheduleDCheckbox().click();
    manageDesignationObject.agreementAcceptedCheckbox().click();
    manageDesignationObject.submitAgreementButton().click();
  });
});
