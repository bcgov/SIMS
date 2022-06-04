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

  editLocationMessage() {
    return cy.contains("Edit Locations");
  }

  addLocationMessage() {
    return cy.contains("Add Location");
  }

  addNewLocationButton() {
    return cy.contains("Add New Location");
  }

  submitButton() {
    return cy.contains("Submit");
  }

  institutionCode() {
    return cy.get("[data-cy='institutionCode']");
  }

  institutionCodeErrorMessage() {
    return cy.contains("Institution code is required");
  }

  locationName() {
    return cy.get("[data-cy='locationName']");
  }

  locationNameErrorMessage() {
    return cy.contains("Location name is required");
  }

  addressFirst() {
    return cy.get("[data-cy='addressLine1']");
  }

  addressErrorMessage() {
    return cy.contains("Address 1 is required");
  }

  addressSecond() {
    return cy.get("[data-cy='addressLine2']");
  }

  cityInputText() {
    return cy.get("[data-cy='city']");
  }

  cityErrorMessage() {
    return cy.contains("City is required");
  }

  postalCode() {
    return cy.get("[data-cy='canadaPostalCode']");
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
    return cy.get("[data-cy='primaryContactFirstName']");
  }

  errorMessage() {
    return cy.get(".form-text.error");
  }

  firstNameErrorMessage() {
    return cy.get("First name is required");
  }

  lastNameINputText() {
    return cy.get("[data-cy='primaryContactLastName']");
  }

  lastNameErrorMessage() {
    return cy.contains("Last Name is required");
  }

  emailInputText() {
    return cy.get("[data-cy='primaryContactEmail']");
  }

  emailErrorMessage() {
    return cy.contains("Email is required");
  }

  phoneInputText() {
    return cy.get("[data-cy='primaryContactPhone']");
  }

  phoneNumberErrorMessage() {
    return cy.contains("Phone Number is required");
  }
}
