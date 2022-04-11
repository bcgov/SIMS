import LoginInstituteObject from "../../page-objects/institute-objects/LoginInstituteObject";
import DashboardInstituteObject from "../../page-objects/institute-objects/DashboardInstituteObject";
import ManageUsersObject from "../../page-objects/institute-objects/ManageUsersObject";

describe("Manage Users", () => {
  const loginInstituteObject = new LoginInstituteObject();
  const dashboardInstituteObject = new DashboardInstituteObject();
  const manageUsersObject = new ManageUsersObject();

  const url = Cypress.env("instituteURL");
  const username = Cypress.env("bceid");
  const password = Cypress.env("password");

  beforeEach(() => {
    cy.visit(url);
    cy.intercept("GET", "**/bceid-account").as("bceidAccount");
    loginInstituteObject.loginWithBCEID().should("be.visible").click();
    loginInstituteObject.loginInWithBCEIDtext().should("be.visible");
    loginInstituteObject
      .bceidInputText()
      .type(username)
      .should("have.value", username);
    loginInstituteObject
      .passwordInputText()
      .type(password)
      .should("have.value", password);
    loginInstituteObject.continueButton().click();
    cy.wait("@bceidAccount");
  });

  it("Verify that user redirect to institute manage user summary page", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
    manageUsersObject.manageUsersButton().click();
    manageUsersObject.userSummaryMessage().should("be.visible");
  });

  it("Verify that user redirect to correct url of institute manage user", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
    manageUsersObject.manageUsersButton().click();
    cy.url().should("contain", "/manage-users");
  });

  it("Verify that user able to edit manage user", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.editButtonFirstRow().click({ force: true });
    manageUsersObject.editUserPermissions().should("be.visible");
  });

  it("Verify that edit user permission dialog box must be closed by pressing cancel button", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.editButtonFirstRow().click({ force: true });
    manageUsersObject.editUserPermissions().should("be.visible");
    manageUsersObject.cancelButton().click();
  });

  it("Verify that user able to search user by clicking on ADD NEW USER button", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.addNewUserButton().click();
    manageUsersObject.selectUserDropdown().click();
    manageUsersObject.filterInputName().type("SIMS COLLF");
  });

  it("Verify that ADD USER button must be disabled if no user selected", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.addNewUserButton().click();
    manageUsersObject.selectUserDropdown().click();
    manageUsersObject.filterInputName().type("SIMS COLLF").type("{enter}");
    manageUsersObject.addUserButton().click();
    manageUsersObject.addUserToAccountMessage().should("be.visible");
    manageUsersObject.cancelButton().click();
  });

  it("Verify that search bar is working properly by searching incorrect word", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    manageUsersObject.manageUsersButton().click({ force: true });
    manageUsersObject.searchUserInputText().type("Dummy data");
    manageUsersObject.searchButton().click();
    manageUsersObject.noRecordsFoundMessage().should("be.visible");
    manageUsersObject.zeroUserContains().should("be.visible");
  });
});
