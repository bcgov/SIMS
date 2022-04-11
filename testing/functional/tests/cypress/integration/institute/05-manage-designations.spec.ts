import LoginInstituteObject from "../../page-objects/institute-objects/LoginInstituteObject";
import DashboardInstituteObject from "../../page-objects/institute-objects/DashboardInstituteObject";
import ManageDesignationsObject from "../../page-objects/institute-objects/ManageDesignationsObject";

describe("Manage Designations", () => {
  const loginInstituteObject = new LoginInstituteObject();
  const dashboardInstituteObject = new DashboardInstituteObject();
  const manageDesignationObject = new ManageDesignationsObject();

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

  it("Verify that user redirect to institute manage designation page", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
    manageDesignationObject.manageDesignationButton().click();
    manageDesignationObject.designationAgreementsText().should("be.visible");
  });

  it("Verify that user redirect to correct url of institute manage designation", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
    manageDesignationObject.manageDesignationButton().click();
    cy.url().should("contain", "/manage-designation");
  });
});
