import LoginMinistryObject from "../../page-objects/ministry-objects/LoginMinistryObject";

export default class MinistryCustomCommand {
  loginMinistry() {
    const loginMinistryObject = new LoginMinistryObject();

    const username = Cypress.env("idirUsername");
    const password = Cypress.env("idirPassword");

    loginMinistryObject.welcomeMessage().should("be.visible");
    loginMinistryObject.loginWithBCEID().click();
    loginMinistryObject.loginUsername().type(username);
    loginMinistryObject.loginPassword().type(password);
    loginMinistryObject.submitButton().click();
  }
}
