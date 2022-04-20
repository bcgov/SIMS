import WelcomeObject from "../../page-objects/student-objects/WelcomeObject";

describe("Welcome Page", () => {
  const welcomeObject = new WelcomeObject();
  const url = Cypress.env("studentURL");
  beforeEach(function () {
    cy.visit(url);
  });

  it("Validate student URL", () => {
    welcomeObject.checkCurrentUrl();
  });

  it("Validate welcomeObject page", () => {
    welcomeObject.getWelcomeText();
  });

  it("Validate Login with BCSC & Sign Up with BCSC buttons are visible", () => {
    welcomeObject.loginWithBCSCButton().should("be.visible");
    welcomeObject.signUpWithBCSCButton().should("be.visible");
  });

  it("Verify that clicking on Login with BCSC button redirects to appropriate page or not", () => {
    welcomeObject.verifyLoginButton().should("be.visible").click();
    welcomeObject.loginSIMSText();
  });

  it("Verify that clicking on Sign Up with BCSC button redirects to appropriate page or not", () => {
    welcomeObject.verifySignUpButton().should("be.visible").click();
    welcomeObject.SignUpSIMSText();
  });

  it("Verify that Setup BC Service card button redirects to appropriate page or not", () => {
    welcomeObject.verifySetUpButton().should("be.visible").click();
    welcomeObject.getSetupButton().should("be.visible").click();
  });

  it("Verify that cancel login link redirects to appropriate page or not", () => {
    welcomeObject.cancelLoginButton().should("be.visible").click();
    welcomeObject.cancelLoginButtonText().should("be.visible").click();
  });

  it("Verify that BC Service card button redirects to appropriate page or not", () => {
    welcomeObject.bcServicesCardAppButton().should("be.visible").click();
    welcomeObject.bcServicesCardAppButtonText().should("be.visible");
    welcomeObject.mobileCardDeviceId().click();
    welcomeObject.pairingCodeBCSCText().should("be.visible");
  });

  it("Verify that virtual testing button redirects to appropriate page or not", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
  });
});
