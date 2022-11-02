import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageUsersObject from "../../page-objects/Institution-objects/ManageUsersObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const manageUsersObject = new ManageUsersObject();
const institutionHelperActions = new InstitutionHelperActions();

describe("Manage Users", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
  });

  it("Verify that user is redirected to manage user summary page", () => {
    manageUsersObject.manageUsersSummary().should("be.visible");
  });

  it("Verify that user is redirected to manage user url", () => {
    cy.url().should("contain", "/manage-users");
  });

  it("Verify that number of retrieved users in the list view", () => {
    manageUsersObject.getUsersList().eq(2);
  });

  it("Verify that user is able to search for the users listed", () => {
    manageUsersObject.searchButton().click().clear().type("AutoUser{enter}");
    manageUsersObject.getUsersList().eq(2);
  });

  it("Verify that 'no records found' is displayed when search returns no results", () => {
    manageUsersObject.searchButton().click().clear().type("no user{enter}");
    manageUsersObject.noRecordsFoundMessage().should("be.visible");
  });

  it("Verify that 'edit user' CTA will open the edit user modal for non-admin", () => {
    manageUsersObject.clickOnEdit("cypressautomation2@auto.test");
  });

  it("Verify that 'Add new user' CTA exists", () => {
    manageUsersObject
      .addNewUserButton()
      .should("be.visible")
      .should("be.enabled");
  });
});

describe("Manage Users - Add new user", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
    manageUsersObject.addNewUserButton().click();
  });

  it("Validate add new user modal", () => {
    expect(
      manageUsersObject.addNewUserModal().should("be.visible")
    ).to.contain.text("Add new user ");

    expect(
      manageUsersObject.inputUserIdOnAddUserModal().should("be.visible")
    ).to.contain.text("Business BCeID user Id");
    manageUsersObject.inputUserIdOnAddUserModal().should("be.visible");
    expect(
      manageUsersObject.isAdminRadioButton().should("be.visible")
    ).to.contain.text("Admin");
    expect(
      manageUsersObject.isLegalSigningAuthorityButton().should("be.visible")
    ).to.contain.text("Legal signing authority");
    manageUsersObject.addUserNowButton().should("be.visible");
    manageUsersObject.cancelButton().should("be.visible");
  });

  it("Validate 'legal signing authority' is only enabled when admin is enabled", () => {
    manageUsersObject.isAdminRadioButton().should("not.be.checked");
    manageUsersObject.isLegalSigningAuthorityButton().should("be.disabled");
    manageUsersObject.isAdminRadioButton().check();
    manageUsersObject.isLegalSigningAuthorityButton().should("not.be.disabled");
    manageUsersObject.assignLocationToUserText().should("not.be.visible");
    manageUsersObject.isLegalSigningAuthorityButton().uncheck();
    manageUsersObject.isAdminRadioButton().should("not.be.checked");
    manageUsersObject.isLegalSigningAuthorityButton().should("be.disabled");
  });

  it("Validate all the institution locations are displayed", () => {
    manageUsersObject.locationsFromAddUserModal().eq(2);
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
    manageUsersObject.inputUserIdOnAddUserModal().click();
    cy.contains("SIMS").should("be.visible");
  });

  it("Search for the users no user is returned", () => {
    manageUsersObject.inputUserIdOnAddUserModal().type("SIMS-ON");
    cy.contains("No data available").should("not.be.visible");
  });
});

describe("Manage Users - edit user modal", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
  });

  it("Validate edit user default modal", () => {
    manageUsersObject.clickOnEdit("cypressautomation2@auto.test");
    manageUsersObject.editUserModal().should("be.visible");
    manageUsersObject.isAdminRadioButton().should("be.checked");
    manageUsersObject.isAdminRadioButton().should("be.unchecked");
    manageUsersObject.editUserNowButton().should("be.visible");
    manageUsersObject.cancelButton().should("be.visible");
  });
});

describe("Manage Users - Adding a user", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click();
  });

  it("Validate adding user to a location", () => {
    manageUsersObject.addNewUserButton();
    manageUsersObject
      .inputUserIdOnAddUserModal()
      .type("cypressautomation@auto.test");
    manageUsersObject.userLocationAccess().click();
    manageUsersObject.addUserNowButton().click();
    manageUsersObject.getUsersList().eq(3);
  });

  it("Validate adding user to as an admin", () => {
    manageUsersObject.addNewUserButton();
    manageUsersObject
      .inputUserIdOnAddUserModal()
      .type("cypressautomation@auto.test");
    manageUsersObject.isAdminRadioButton().click();
    manageUsersObject.isLegalSigningAuthorityButton().click();
    manageUsersObject.addUserNowButton().click();
    manageUsersObject.getUsersList().eq(3);
  });

  it("Validate Edit user", () => {
    manageUsersObject.clickOnEdit("cypressautomation2@auto.test");
    manageUsersObject.userLocationAccess().click();
    manageUsersObject.addUserNowButton().click();
    manageUsersObject.getUsersList().eq(3);
  });
});
