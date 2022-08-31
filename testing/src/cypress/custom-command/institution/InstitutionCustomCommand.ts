import LoginInstitutionObject from "../../page-objects/Institution-objects/LoginInstitutionObject";

export default class InstitutionCustomCommand {
  loginWithCredentials(username: string, password: string) {
    const loginInstitutionObject = new LoginInstitutionObject();

    loginInstitutionObject.loginWithBCEID().should("be.visible").click();
    loginInstitutionObject.loginInWithBCEIDtext().should("be.visible");

    loginInstitutionObject
      .bceidInputText()
      .type(username)
      .should("have.value", username);
    loginInstitutionObject
      .passwordInputText()
      .type(password)
      .should("have.value", password);
    loginInstitutionObject.continueButton().click();
  }
}
