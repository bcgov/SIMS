export default class InstitutionProfileObject {
  institutionDetailsButton() {
    return cy.contains("Institution Details");
  }

  institutionInformationText() {
    return cy.contains("Institution Information");
  }

  legalOperatingNameInputText() {
    return cy.get("[data-cy='legalOperatingName']");
  }

  primaryEmailInputText() {
    return cy.get("[data-cy='primaryContactEmail']");
  }

  submitButton() {
    return cy.get("[data-cy='submit']]");
  }

  unexpectedErrorMessage() {
    return cy.contains("Unexpected error");
  }

  primaryPhoneNumberInputText() {
    return cy.get("[data-cy='primaryPhone']");
  }

  institutionWebsiteInputText() {
    return cy.get("[data-cy='website']");
  }

  institutionRegulationBodyDropdown() {
    return cy.get(".form-control.ui");
  }

  institutionRegulationBodyDropdownInputType() {
    return cy.get(".choices__input");
  }

  establishedDate() {
    return cy.get(".input");
  }

  firstNameInstitutionInputText() {
    return cy.get("[data-cy='primaryContactFirstName']");
  }

  lastNameInstitutionInputText() {
    return cy.get("[data-cy='primaryContactLastName']");
  }

  emailInstitutionInputText() {
    return cy.get("[data-cy='primaryContactEmail']");
  }

  phoneNumberInstitutionInputText() {
    return cy.get("[data-cy='primaryContactPhone']");
  }

  firstNameAuthorizedInputText() {
    return cy.get("[data-cy='primaryContactFirstName']");
  }

  lastNameAuthorizedInputText() {
    return cy.get("[data-cy='primaryContactLastName]");
  }

  emailAuthorizedInputText() {
    return cy.get("[data-cy='primaryContactEmail']");
  }

  phoneNumberAuthorizedInputText() {
    return cy.get("[data-cy='primaryContactPhone]");
  }

  addressInstitutionInputText() {
    return cy.get("[data-cy='addressLine1']");
  }

  cityInputText() {
    return cy.get("[data-cy='city']");
  }

  postalInputText() {
    return cy.get("[data-cy='canadaPostalCode']");
  }

  countryInputText() {
    return cy.xpath("//div[@id='e96525o']//div[@role='combobox']");
  }

  countrySearchInputText(country: string) {
    return cy
      .xpath("//div[@id='e96525o']//input[@role='textbox']")
      .type(country);
  }

  provinceInputText() {
    return cy.xpath("//div[@id='etbe9cx']//div[@role='combobox']");
  }

  provinceSearchInputText(province: string) {
    return cy
      .xpath("//div[@id='etbe9cx']//input[@role='textbox']")
      .type(province);
  }
}
