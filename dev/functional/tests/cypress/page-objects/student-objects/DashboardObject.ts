export default class DashboardObject {
  applicationButton() {
    return cy.contains("Applications");
  }

  notificationButton() {
    return cy.contains("Notifications");
  }

  fileUploaderButton() {
    return cy.contains("File Uploader");
  }

  profileButton() {
    return cy.contains("Profile");
  }

  personIconButton() {
    return cy.get("[type='button']").eq(5);
  }

  startapplicationButton() {
    return cy.contains("Start application");
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
