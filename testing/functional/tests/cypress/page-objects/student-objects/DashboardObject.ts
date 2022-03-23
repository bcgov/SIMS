export default class DashboardObject {
  applicationButton() {
    return cy.xpath("//button[normalize-space()='Applications']");
  }

  notificationButton() {
    return cy.xpath("//button[normalize-space()='Notifications']");
  }

  fileUploaderButton() {
    return cy.xpath("//button[normalize-space()='File Uploader']");
  }

  profileButton() {
    return cy.xpath("//button[normalize-space()='Profile']");
  }

  personIconButton() {
    return cy.xpath("//button[contains(@class,'v-btn--size-default mr-5')]");
  }

  startapplicationButton() {
    return cy.xpath("//button[normalize-space()='Start application']");
  }

  logOffButton() {
    return cy.contains("Log off");
  }

  manageLoanButton() {
    return cy.xpath("//button[@name='data[manageLoan]']");
  }

  verifyLogOff() {
    return cy.xpath("//button[contains(@class,'v-btn--size-default mr-5')]");
  }

  logOffText() {
    return cy.contains("Log off");
  }

  welcomeToStudentBC() {
    return cy.contains("Welcome to StudentAid BC");
  }

  enterYourPasscode() {
    return cy.contains("Enter Your Passcode");
  }

  clickOnDraftStatus() {
    cy.get("//tbody/tr/td[5]").each(($el) => {
      if ($el.text() === "Draft") {
        $el.click();
      }
    });
  }
}
