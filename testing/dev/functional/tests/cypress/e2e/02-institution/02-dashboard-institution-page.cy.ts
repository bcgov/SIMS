import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Dashboard Page", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("institutionURL");

  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it("Verify that user redirect to dashboard page", () => {
    cy.url().should("include", "/dashboard");
  });

  it("Verify that all buttons are clickable in dashboard and redirect to appropriate pages.", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.notificationButton().click();
    dashboardInstitutionObject.programsButton().eq(0).click();
    dashboardInstitutionObject.activeApplicationsButton().eq(0).click();
    dashboardInstitutionObject.programInfoRequestsButton().eq(0).click();
    dashboardInstitutionObject.confirmationOfEnrollment().eq(0).click();
    dashboardInstitutionObject.homeButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.profileButton().click();
    dashboardInstitutionObject.profileIconButton().click();
    dashboardInstitutionObject.logOffButton().click();
  });

  it("Verify that under confirmation of enrollment both sections open.", () => {
    dashboardInstitutionObject.confirmationOfEnrollment().eq(0).click();
    dashboardInstitutionObject
      .confirmationEnrollmentVerifyText()
      .should("be.visible");
    dashboardInstitutionObject.upcomingEnrollmentText().click();
    dashboardInstitutionObject
      .upcomingEnrollmentVerifyText()
      .should("be.visible");
    dashboardInstitutionObject.confirmationEnrollmentText().click();
    dashboardInstitutionObject
      .confirmationEnrollmentVerifyText()
      .should("be.visible");
  });

  it("Verify that clicking on manage institution leads Location Summary page", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
  });
});
