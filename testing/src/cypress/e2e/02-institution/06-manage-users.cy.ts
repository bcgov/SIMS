import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageUsersObject from "../../page-objects/Institution-objects/ManageUsersObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import { it } from "mocha";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const manageUsersObject = new ManageUsersObject();
const institutionHelperActions = new InstitutionHelperActions();

describe("Manage Users", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
  });

  beforeEach(() => {
    manageUsersObject.searchButton().click().clear().type("{enter}");
  });

  it("Verify that user is redirected to manage user summary page", () => {
    manageUsersObject.manageUsersSummary().should("be.visible");
  });

  it("Verify that user is redirected to manage user url", () => {
    cy.url().should("contain", "/manage-users");
  });

  it("Verify that number of retrieved users in the list view", () => {
    manageUsersObject
      .getUsersList()
      .should("be.visible")
      .should("have.length", 1);
  });

  it("Verify that user is able to search for the users listed", () => {
    manageUsersObject.searchButton().click().clear().type("SIMS{enter}");
    manageUsersObject.getUsersList().should("have.length", 1);
  });

  it("Verify that 'no records found' is displayed when search returns no results", () => {
    manageUsersObject.searchButton().click().clear().type("no user{enter}");
    manageUsersObject.noRecordsFoundMessage().should("be.visible");
  });

  it("Verify that 'edit user' CTA will open the edit user modal for non-admin", () => {
    manageUsersObject.clickOnEdit("automationuser1@test.com");
    manageUsersObject.editUserModal().should("be.visible");
    manageUsersObject.cancelButton().click();
  });

  it("Verify that 'Add new user' CTA exists", () => {
    manageUsersObject
      .addNewUserButton()
      .should("be.visible")
      .should("be.enabled");
  });
});

describe.skip("Manage Users - Add new user", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
  });

  beforeEach(() => {
    manageUsersObject.addNewUserButton().click();
  });

  afterEach(() => {
    manageUsersObject.cancelButton().click();
  });

  it("Validate add new user modal", () => {
    manageUsersObject.addNewUserModal().should("be.visible");
    manageUsersObject.addNewUserModalTitle().should("be.visible");
    manageUsersObject.inputUserIdOnAddUserModal().should("be.visible");
    manageUsersObject
      .inputUserIdOnAddUserModal()
      .should("be.visible")
      .should("contain", "Business BCeID user Id");

    manageUsersObject
      .isAdminRadioButton()
      .should("be.visible")
      .should("have.text", "Admin");
    manageUsersObject
      .isLegalSigningAuthorityButton()
      .should("have.text", "Legal signing authority");
    manageUsersObject.addUserNowButton().should("be.visible");
    manageUsersObject.cancelButton().should("be.visible");
  });

  it("Validate 'legal signing authority' is only enabled when admin is enabled", () => {
    manageUsersObject.isAdminRadioButton().should("not.be.checked");
    manageUsersObject.isAdminRadioButton().click();
    manageUsersObject.isLegalSigningAuthorityButton().should("not.be.disabled");
    manageUsersObject.isLegalSigningAuthorityButton().click();
    manageUsersObject.isAdminRadioButton().should("not.be.checked");
  });

  it("Validate all the institution locations are displayed", () => {
    manageUsersObject.locationsFromAddUserModal().should("have.length", "1");
  });

  it("Validate Errors displayed when mandatory information is not filled in", () => {
    manageUsersObject.addUserNowButton().click();
    cy.contains("Business BCeID user Id is required.").should("be.visible");
    cy.contains(
      "The user should be either an admin or have access to at least one location."
    ).should("be.visible");
    cy.contains("Select at least one location for non-admin users.").should(
      "be.visible"
    );
  });

  it("Validate user is able to be searchable by BCeID + UserId", () => {
    manageUsersObject.inputUserIdOnAddUserModal().type("SIMS COLLF");
    manageUsersObject.addNewUserModal().parent().contains("SIMS COLLF").click();
  });

  it("Search for the users no user is returned", () => {
    manageUsersObject.inputUserIdOnAddUserModal().type("SIMS-ON");
    cy.contains("No data available").should("be.visible");
  });
});

describe.skip("Manage Users - edit user modal", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
  });

  it("Validate edit user default modal", () => {
    manageUsersObject.clickOnEdit("automationuser1@test.com");
    manageUsersObject.editUserModal().should("be.visible");
    manageUsersObject
      .isAdminRadioButton()
      .get("[type='checkbox']")
      .should("be.checked");
    manageUsersObject.editUserNowButton().should("be.visible");
    manageUsersObject.cancelButton().should("be.visible");
  });
});

describe.skip("Manage Users - Adding a user", () => {
  //TODO intentionally skipped once we have the dedicated set of users to test this institution. For now keeping the test cases
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
  });

  it("Validate adding user to a location", () => {
    manageUsersObject.addNewUserButton();
    manageUsersObject
      .inputUserIdOnAddUserModal()
      .type("automationuser2@test.com");
    manageUsersObject.userLocationAccess().click();
    manageUsersObject.addUserNowButton().click();
    manageUsersObject.getUsersList().should("have.length", 1);
  });

  it("Validate adding user to as an admin", () => {
    //TODO this will needs to separated to a new institution. Will change once the cypress test data scripts are ready
    manageUsersObject.addNewUserButton();
    manageUsersObject
      .inputUserIdOnAddUserModal()
      .type("automationuser3@test.com");
    manageUsersObject.isAdminRadioButton().click();
    manageUsersObject.isLegalSigningAuthorityButton().click();
    manageUsersObject.addUserNowButton().click();
    manageUsersObject.getUsersList().eq(3);
  });
});
