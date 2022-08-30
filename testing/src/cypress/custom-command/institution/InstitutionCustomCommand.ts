import LoginInstitutionObject from "../../page-objects/Institution-objects/LoginInstitutionObject";

export default class InstitutionCustomCommand {
  loginWithCredentials(uname: string, pass: string) {
    const loginInstitutionObject = new LoginInstitutionObject();

    loginInstitutionObject.loginWithBCEID().should("be.visible").click();
    loginInstitutionObject.loginInWithBCEIDtext().should("be.visible");

    loginInstitutionObject
      .bceidInputText()
      .type(uname)
      .should("have.value", uname);
    loginInstitutionObject
      .passwordInputText()
      .type(pass)
      .should("have.value", pass);
    loginInstitutionObject.continueButton().click();
  }
}
