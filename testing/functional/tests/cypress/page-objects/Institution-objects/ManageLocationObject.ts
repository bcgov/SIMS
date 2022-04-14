export default class ManageLocationObject {
  manageLocationButton() {
    return cy.get(".v-list > :nth-child(2)");
  }

  editLocationButton() {
    return cy.xpath(
      "(//button[contains(@type,'button')][normalize-space()='Edit'])[1]"
    );
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
    return cy.xpath("//input[@id='eajd6ld-institutionCode']");
  }

  institutionCodeErrorMessage() {
    return cy.contains("Institution code is required");
  }

  locationName() {
    return cy.get("#eshsg2q-locationName");
  }

  locationNameErrorMessage() {
    return cy.contains("Location name is required");
  }

  addressFirst() {
    return cy.get("#efqwiex-addressLine1");
  }

  addressErrorMessage() {
    return cy.contains("Address 1 is required");
  }

  addressSecond() {
    return cy.get("#ewj86m-addressLine2");
  }

  cityInputText() {
    return cy.get("#eeodxxt-city");
  }

  cityErrorMessage() {
    return cy.contains("City is required");
  }

  postalCode() {
    return cy.get("#et77w0d-postalCode");
  }

  postalErrorMessage() {
    return cy.contains("Postal/ZIP code is required");
  }

  stateInputText() {
    return cy.get("#ev86aqq-provinceState");
  }

  stateErrorMessage() {
    return cy.contains("Province/State is required");
  }

  countryInputText() {
    return cy.get("#emigtml-country");
  }

  countryErrorMessage() {
    return cy.contains("Country is required");
  }

  firstNameInputText() {
    return cy.get("#eq7jd6x-primaryContactFirstName");
  }

  firstNameErrorMessage() {
    return cy.contains("First Name is required");
  }

  lastNameINputText() {
    return cy.get("#eub36lf-primaryContactLastName");
  }

  lastNameErrorMessage() {
    return cy.contains("Last Name is required");
  }

  emailInputText() {
    return cy.get("#ewutrt-primaryContactEmail");
  }

  emailErrorMessage() {
    return cy.contains("Email is required");
  }

  phoneInputText() {
    return cy.get("#eolimx-primaryContactPhone");
  }

  phoneNumberErrorMessage() {
    return cy.contains("Phone Number is required");
  }
}
