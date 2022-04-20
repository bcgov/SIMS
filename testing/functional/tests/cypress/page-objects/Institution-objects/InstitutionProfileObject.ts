export default class InstitutionProfileObject {
  institutionDetailsButton() {
    return cy.contains("Institution Details");
  }

  institutionInformationText() {
    return cy.contains("Institution Information");
  }

  legalOperatingNameInputText() {
    return cy.get("#ek5v67e-institutionLegalName");
  }

  primaryEmailInputText() {
    return cy.get("#e2xfh3d-primaryEmail");
  }

  submitButton() {
    return cy.contains("Submit");
  }

  unexpectedErrorMessage() {
    return cy.contains("Unexpected error");
  }

  //region Institution Information Form

  institutionOperatingNameInputText() {
    return cy.get("#ek9fo68-operatingName");
  }

  primaryPhoneNumberInputText() {
    return cy.get("#ee6c4q-primaryPhone");
  }

  institutionWebsiteInputText() {
    return cy.get("#eao17vh-website");
  }

  institutionRegulationBodyDropdown() {
    return cy.xpath("//div[@class='form-control ui fluid selection dropdown']");
  }

  institutionRegulationBodyDropdownInputType() {
    return cy.get(".choices__input");
  }

  establishedDate(date: string) {
    return cy.get(".input").type(date);
  }

  firstNameInstitutionInputText() {
    return cy.get("#eytixvp-primaryContactFirstName");
  }

  lastNameInstitutionInputText() {
    return cy.get("#e2q6a1-primaryContactLastName");
  }

  emailInstitutionInputText() {
    return cy.get("#efjjde8-primaryContactEmail");
  }

  phoneNumberInstitutionInputText() {
    return cy.get("#e46djjn-primaryContactPhone");
  }

  firstNameAuthorizedInputText() {
    return cy.get("#encraef-legalAuthorityFirstName");
  }

  lastNameAuthorizedInputText() {
    return cy.get("#e33dhc5-legalAuthorityLastName");
  }

  emailAuthorizedInputText() {
    return cy.get("#ex78m-legalAuthorityEmail");
  }

  phoneNumberAuthorizedInputText() {
    return cy.get("#ep2tska-legalAuthorityPhone");
  }

  addressInstitutionInputText() {
    return cy.get("#etidnj-addressLine1");
  }

  cityInputText() {
    return cy.get("#ef7v2mz-city");
  }

  postalInputText() {
    return cy.get("#ekq7msk-postalCode");
  }

  provinceInputText() {
    return cy.get("#ec1sbfh-provinceState");
  }

  countryInputText() {
    return cy.get("#eqkemjt-country");
  }
  //#endregion
}
