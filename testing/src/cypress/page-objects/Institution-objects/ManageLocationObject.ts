export enum Provinces {
  Alberta = "AB",
  BritishColumbia = "BC",
  Manitoba = "MB",
  NewBrunswick = "NB",
  NewFoundlandAndLabrador = "NL",
  NovaScotia = "NS",
  Ontario = "ON",
  PrinceEdwardIsland = "PE",
  Quebec = "QC",
  Saskatchewan = "SK",
  Yukon = "YT",
  NorthernTerritories = "NT",
  Nunavut = "NU",
}

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

  locationDetailsText() {
    return cy.contains("Location details");
  }

  addLocationMessage() {
    return cy.contains("Add Location");
  }

  addLocationButton() {
    return cy.contains("Add location");
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

  addressLine1() {
    return cy.get("[data-cy='addressLine1']");
  }

  addressErrorMessage() {
    return cy.contains("Address 1 is required");
  }

  addressLine2() {
    return cy.get("[data-cy='addressLine2']");
  }

  cityInputText() {
    return cy.get("[data-cy='city']");
  }

  cityErrorMessage() {
    return cy.contains("City is required");
  }

  canadaPostalCode() {
    return cy.get("[data-cy='canadaPostalCode']");
  }

  otherPostalCode() {
    return cy.get("[data-cy='otherPostalCode']");
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

  countryDropDownMenu() {
    return cy.get("[data-cy='selectedCountry']").parent();
  }

  countryCanadaFromDropDownMenu() {
    return cy.get('div[data-value="Canada"]');
  }

  countryOtherFromDropDownMenu() {
    return cy.get('div[data-value="other"]');
  }

  otherCountryInputText() {
    return cy.get("[data-cy='otherCountry']");
  }

  provinceDropDownMenu() {
    return cy.get("[data-cy='provinceState']").parent();
  }

  getProvinceFromDropdown(province: Provinces) {
    return cy.get(`div[data-value="${province}"]`);
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

  lastNameInputText() {
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

  locationNameText() {
    return cy.contains("Location name");
  }

  institutionCodeText() {
    return cy.contains("Institution code");
  }

  address1Text() {
    return cy.contains("Address 1");
  }

  address2Text() {
    return cy.contains("Address 2");
  }

  countryText() {
    return cy.contains("Country");
  }

  provinceText() {
    return cy.contains("Province");
  }

  cityText() {
    return cy.contains("City");
  }

  postalCodeText() {
    return cy.contains("Postal/ZIP code");
  }

  primaryContactText() {
    return cy.contains("Primary contact");
  }

  firstNameText() {
    return cy.contains("First name");
  }

  lastNameText() {
    return cy.contains("Last name");
  }

  emailText() {
    return cy.contains("Email");
  }

  phoneNumberText() {
    return cy.contains("Phone number");
  }
}
