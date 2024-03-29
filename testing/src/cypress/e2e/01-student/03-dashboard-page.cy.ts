import DashboardObject from "../../page-objects/student-objects/DashboardObject";
import StudentCustomCommand from "../../custom-command/student/StudentCustomCommand";

describe("Dashboard Page", () => {
  const dashboardObject = new DashboardObject();
  const studentCustomCommand = new StudentCustomCommand();
  const url = Cypress.env("studentURL");

  beforeEach(
    "Verify that user successfully redirects to Dashboard Page.",
    () => {
      cy.visit(url);
      studentCustomCommand.loginStudent();
    }
  );

  it("Verify that all buttons are present in Dashboard Page.", () => {
    dashboardObject.applicationButton().should("be.visible");
    dashboardObject.notificationButton().should("be.visible");
    dashboardObject.fileUploaderButton().should("be.visible");
    dashboardObject.profileButton().should("be.visible");
    dashboardObject.personIconButton().should("be.visible");
    dashboardObject.startapplicationButton().should("be.visible");
    dashboardObject.manageLoanButton().should("be.visible");
  });

  it("Check that clicking on buttons redirects to appropriate pages.", () => {
    dashboardObject.applicationButton().should("be.visible").click();
    dashboardObject.notificationButton().should("be.visible").click();
    dashboardObject.fileUploaderButton().should("be.visible").click();
    dashboardObject.profileButton().should("be.visible").click();
    dashboardObject.personIconButton().should("be.visible").click();
    dashboardObject.logOffButton().click();
  });
});
