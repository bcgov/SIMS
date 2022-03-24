export default class LoginObject {
  cardSerialNumberInputText() {
    return cy.get("#csn", { timeout: 5000 });
  }

  cardSerialNumberContinueButton() {
    return cy.get("#continue");
  }

  passcodeInputText() {
    return cy.get("#passcode");
  }

  passcodeContinueButton() {
    return cy.get("#btnSubmit");
  }

  verifyLoggedInText() {
    return cy.contains("Hello!");
  }
}
