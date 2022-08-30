import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageUsersObject from "../../page-objects/Institution-objects/ManageUsersObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Manage Users", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const manageUsersObject = new ManageUsersObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const LOGIN_URL = Cypress.env("TEST").BASE_URL + "/institution/login";
  const UNAME = Cypress.env("TEST").UNAME_1;
  const PASS = Cypress.env("TEST").PASS_1;

  beforeEach(() => {
    cy.visit(LOGIN_URL);
    institutionCustomCommand.loginWithCredentials(UNAME, PASS);
  });

  it("Verify that user redirect to institution manage user summary page", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    manageUsersObject.manageUsersButton().click();
    manageUsersObject.userSummaryMessage().should("be.visible");
  });

  it("Verify that user redirect to correct url of institution manage user", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    manageUsersObject.manageUsersButton().click();
    cy.url().should("contain", "/manage-users");
  });

  it("Verify that user able to edit manage user", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.editButtonFirstRow().click({ force: true });
    manageUsersObject.editUserPermissions().should("be.visible");
  });

  it("Verify that edit user permission dialog box must be closed by pressing cancel button", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.editButtonFirstRow().click({ force: true });
    manageUsersObject.editUserPermissions().should("be.visible");
    manageUsersObject.cancelButton().click();
  });

  it("Verify that user able to search user by clicking on ADD NEW USER button", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.addNewUserButton().click();
    manageUsersObject.selectUserDropdown().click();
    manageUsersObject.filterInputName().type("SIMS COLLF");
  });

  it("Verify that ADD USER button must be disabled if no user selected", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.addNewUserButton().click();
    manageUsersObject.selectUserDropdown().click();
    manageUsersObject.filterInputName().type("SIMS COLLF").type("{enter}");
    manageUsersObject.addUserButton().click();
    manageUsersObject.addUserToAccountMessage().should("be.visible");
    manageUsersObject.cancelButton().click();
  });

  it("Verify that search bar is working properly by searching incorrect word", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.searchUserInputText().type("Dummy data");
    manageUsersObject.searchButton().click();
    manageUsersObject.noRecordsFoundMessage().should("be.visible");
    manageUsersObject.zeroUserContains().should("be.visible");
  });
});
