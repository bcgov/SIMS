export default class LoginObject {
  cardSerialNumberInputText() {
    return cy.get("#csn");
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

  cardNotFoundText() {
    return cy.contains("Card Not Found");
  }

  emptyCardNumberText() {
    return cy.contains("Enter the card serial number");
  }

  enterKeyFromCardSerialNumber() {
    return cy.get("#csn");
  }

  enterKeyFromPasscode() {
    return cy.get("#passcode");
  }

  passcodePageText() {
    return cy.contains("Enter Your Passcode");
  }

  maxCharacterCardSerialNumber() {
    return cy.xpath("//input[@maxlength='15']");
  }

  caseSenstivityCardSerialNumber() {
    return cy.get("input#csn.form-control.text-uppercase");
  }

  incorrectPasscodeText() {
    return cy.contains("Please re-enter your passcode");
  }

  whiteSpacePasscodeText() {
    return cy.contains("Please try again later");
  }

  wait() {
    return cy.wait(4000);
  }

  verifyMaskablePassword() {
    return cy.xpath("//input[@type='password']");
  }
}
