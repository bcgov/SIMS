export default class ManageLocationObject {
  manageLocationButton() {
    return cy.get(".v-list > :nth-child(2)");
  }

  editLocationButton() {
    return cy.contains("Edit");
  }

  additionalInstitutionLocationMessage() {
    return cy.contains("Let’s add an additional institution location");
  }

  addNewLocationButton() {
    return cy.contains("Add New Location");
  }

  submitButton() {
    return cy.contains("Submit");
  }

  institutionCode() {
    return cy.get("[name='data[institutionCode]']");
  }

  institutionCodeErrorMessage() {
    return cy.contains("Institution code is required");
  }

  locationName() {
    return cy.get("[name='data[locationName]']");
  }

  locationNameErrorMessage() {
    return cy.contains("Location name is required");
  }

  addressFirst() {
    return cy.get("[name='data[addressLine1]']");
  }

  addressErrorMessage() {
    return cy.contains("Address 1 is required");
  }

  addressSecond() {
    return cy.get("[name='data[addressLine2]']");
  }

  cityInputText() {
    return cy.get("[name='data[city]']");
  }

  cityErrorMessage() {
    return cy.contains("City is required");
  }

  postalCode() {
    return cy.get("[name='data[postalCode]']");
  }

  postalErrorMessage() {
    return cy.contains("Postal/ZIP code is required");
  }

  stateInputText() {
    return cy.get("[name='data[provinceState]']");
  }

  stateErrorMessage() {
    return cy.contains("Province/State is required");
  }

  countryInputText() {
    return cy.get("[name='data[country]']");
  }

  countryErrorMessage() {
    return cy.contains("Country is required");
  }

  firstNameInputText() {
    return cy.get("[name='data[primaryContactFirstName]']");
  }

  firstNameErrorMessage() {
    return cy.contains("First Name is required");
  }

  lastNameINputText() {
    return cy.get("[name='data[primaryContactLastName]']");
  }

  lastNameErrorMessage() {
    return cy.contains("Last Name is required");
  }

  emailInputText() {
    return cy.get("[name='data[primaryContactEmail]']");
  }

  emailErrorMessage() {
    return cy.contains("Email is required");
  }

  phoneInputText() {
    return cy.get("[name='data[primaryContactPhone]']");
  }

  phoneNumberErrorMessage() {
    return cy.contains("Phone Number is required");
  }
}
