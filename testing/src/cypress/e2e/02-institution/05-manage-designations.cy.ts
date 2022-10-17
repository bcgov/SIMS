import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageDesignationsObject from "../../page-objects/Institution-objects/ManageDesignationsObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import ManageInstitutionObject from "../../page-objects/Institution-objects/ManageInstitutionObject";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const manageDesignationObject = new ManageDesignationsObject();
const institutionHelperActions = new InstitutionHelperActions();
const manageInstitutionObject = new ManageInstitutionObject();

describe("Manage Designations", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageDesignationObject.manageDesignationButton().click();
  });

  it("Verify that user redirect to institution manage designation page", () => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageDesignationObject.manageDesignationButton().click();
    manageDesignationObject.designationAgreementsText().should("be.visible");
  });

  it("Verify that user redirect to correct url of institution manage designation", () => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageDesignationObject.manageDesignationButton().click();
    cy.url().should("contain", "/manage-designation");
  });

  it("Verify that view button exists and clicking on should open up the designation agreement be able to navigate back", () => {
    manageDesignationObject
      .viewDesignationButton()
      .should("be.visible")
      .click();
    manageDesignationObject.viewDesignationText().should("be.visible");
    manageDesignationObject
      .manageDesignationsBackButton()
      .should("be.visible")
      .click();
    manageDesignationObject.designationAgreementsText().should("be.visible");
  });
});

describe("Designation Details", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageDesignationObject.manageDesignationButton().click();
    manageDesignationObject.viewDesignationButton().click();
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

describe("Request Designation", () => {
  //TODO Intentionally skipped until we have control over the data that is created. Since we can have one `request for designation` in progress
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  beforeEach(() => {
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageDesignationObject.manageDesignationButton().click();
    manageDesignationObject.requestDesignationButton().click();
  });

  it("Clicking on manage locations should navigate to locations page", () => {
    manageDesignationObject.manageLocationsHyperlink().click();
    dashboardInstitutionObject.allLocationsText().should("be.visible");
  });

  it("Clicking on cancel should navigate back to manage designations page", () => {
    manageDesignationObject.cancelAgreementButton().scrollIntoView().click();
    manageDesignationObject.designationAgreementsText().should("be.visible");
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
