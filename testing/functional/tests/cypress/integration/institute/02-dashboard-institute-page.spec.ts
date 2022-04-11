import LoginInstituteObject from "../../page-objects/institute-objects/LoginInstituteObject";
import DashboardInstituteObject from "../../page-objects/institute-objects/DashboardInstituteObject";

describe("Dashboard Page", () => {
  const loginInstituteObject = new LoginInstituteObject();
  const dashboardInstituteObject = new DashboardInstituteObject();

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

  it("Verify that user redirect to dashboard page", () => {
    cy.url().should("include", "/dashboard");
  });

  it("Verify that all buttons are clickable in dashboard and redirect to appropriate pages.", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.notificationButton().click();
    dashboardInstituteObject.programsButton().eq(0).click();
    dashboardInstituteObject.activeApplicationsButton().eq(0).click();
    dashboardInstituteObject.programInfoRequestsButton().eq(0).click();
    dashboardInstituteObject.confirmationOfEnrollment().eq(0).click();
    dashboardInstituteObject.homeButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.profileButton().click();
    dashboardInstituteObject.profileIconButton().click();
    dashboardInstituteObject.logOffButton().click();
  });

  it("Verify that under confirmation of enrollment both sections open.", () => {
    dashboardInstituteObject.confirmationOfEnrollment().eq(0).click();
    dashboardInstituteObject
      .confirmationEnrollmentVerifyText()
      .should("be.visible");
    dashboardInstituteObject.upcomingEnrollmentText().click();
    dashboardInstituteObject
      .upcomingEnrollmentVerifyText()
      .should("be.visible");
    dashboardInstituteObject.confirmationEnrollmentText().click();
    dashboardInstituteObject
      .confirmationEnrollmentVerifyText()
      .should("be.visible");
  });

  it("Verify that clicking on manage institution leads Location Summary page", () => {
    dashboardInstituteObject.dashboardButton().click();
    dashboardInstituteObject.manageInstitutionButton().click();
    dashboardInstituteObject.locationVerifyText().should("be.visible");
  });
});
