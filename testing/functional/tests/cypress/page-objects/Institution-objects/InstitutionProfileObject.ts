export default class InstitutionProfileObject {
  institutionDetailsButton() {
    return cy.contains("Institution Details");
  }

  institutionInformationText() {
    return cy.contains("Institution Information");
  }

  legalOperatingNameInputText() {
    return cy.get("[name='data[institutionLegalName]']");
  }

  primaryEmailInputText() {
    return cy.get("[name='data[primaryEmail]']");
  }

  submitButton() {
    return cy.contains("Submit");
  }

  unexpectedErrorMessage() {
    return cy.contains("Unexpected error");
  }

  primaryPhoneNumberInputText() {
    return cy.get("[name='data[primaryPhone]']");
  }

  institutionWebsiteInputText() {
    return cy.get("[name='data[website]']");
  }

  institutionRegulationBodyDropdown() {
    return cy.get(".form-control.ui");
  }

  institutionRegulationBodyDropdownInputType() {
    return cy.get(".choices__input");
  }

  establishedDate(date: string) {
    return cy.get(".input").type(date);
  }

  firstNameInstitutionInputText() {
    return cy.get("[name='data[primaryContactFirstName]']");
  }

  lastNameInstitutionInputText() {
    return cy.get("[name='data[primaryContactLastName]']");
  }

  emailInstitutionInputText() {
    return cy.get("[name='data[primaryContactEmail]']");
  }

  phoneNumberInstitutionInputText() {
    return cy.get("[name='data[primaryContactPhone]']");
  }

  firstNameAuthorizedInputText() {
    return cy.get("[name='data[legalAuthorityFirstName]']");
  }

  lastNameAuthorizedInputText() {
    return cy.get("[name='data[legalAuthorityLastName]']");
  }

  emailAuthorizedInputText() {
    return cy.get("[name='data[legalAuthorityEmail]']");
  }

  phoneNumberAuthorizedInputText() {
    return cy.get("[name='data[legalAuthorityPhone]']");
  }

  addressInstitutionInputText() {
    return cy.get("[name='data[addressLine1]']");
  }

  cityInputText() {
    return cy.get("[name='data[city]']");
  }

  postalInputText() {
    return cy.get("[name='data[postalCode]']");
  }

  provinceInputText() {
    return cy.get("[name='data[provinceState]']");
  }

  countryInputText() {
    return cy.get("[name='data[country]']");
  }
}
