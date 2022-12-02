import BaseMethods from "./BaseMethods";

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

export default class ManageLocationObject extends BaseMethods {
  manageLocationHeader() {
    return this.getElementByCyId("manageLocationHeader");
  }

  getInstitutionsList() {
    return this.getElementByCyId("institutionLocation");
  }

  getInstitutionByLocationName(locationName: string) {
    return this.getElementByCyId("locationName")
      .contains(locationName)
      .parentsUntil("[data-cy='institutionLocation']");
  }

  editLocationButton(locationName: string) {
    return this.getInstitutionByLocationName(locationName).get(
      "[data-cy='editLocation']"
    );
  }

  editLocationHeader() {
    return this.getElementByCyId("editLocationHeader");
  }

  institutionCode() {
    return this.getElementByCyId("institutionCode");
  }

  locationName() {
    return this.getElementByCyId("locationName");
  }

  address1() {
    return this.getElementByCyId("addressLine1");
  }

  address2() {
    return this.getElementByCyId("addressLine2");
  }

  country() {
    return this.getElementByCyId("selectedCountry");
  }

  provinceText() {
    return this.getElementByCyId("provinceState");
  }

  city() {
    return this.getElementByCyId("city");
  }

  canadaPostalCode() {
    return this.getElementByCyId("canadaPostalCode");
  }

  otherPostalCode() {
    return this.getElementByCyId("otherPostalCode");
  }

  lastNameInputText() {
    return this.getElementByCyId("primaryContactLastName");
  }

  submitButton() {
    return this.getElementByCyId("primaryFooterButton");
  }

  addLocationButton() {
    return this.getElementByCyId("addLocation");
  }
  
  manageLocationsBackButton() {
    return cy.contains("Manage location");
  }

  institutionCodeErrorMessage() {
    return cy.contains("Institution code is required");
  }

  locationNameErrorMessage() {
    return cy.contains("Location name is required");
  }

  cityInputText() {
    return this.getElementByCyId("city");
  }

  address1ErrorMessage() {
    return cy.contains("Address1 is required");
  }

  cityErrorMessage() {
    return cy.contains("City is required");
  }

  stateErrorMessage() {
    return cy.contains("Province/State is required");
  }

  countryErrorMessage() {
    return cy.contains("Country is required");
  }

  countryDropDownMenu() {
    return this.getElementByCyId("selectedCountry").parent();
  }

  countryCanadaFromDropDownMenu() {
    return cy.get('div[data-value="Canada"]');
  }

  countryOtherFromDropDownMenu() {
    return cy.get('div[data-value="other"]');
  }

  otherCountryInputText() {
    return this.getElementByCyId("otherCountry");
  }

  provinceDropDownMenu() {
    return this.getElementByCyId("provinceState").parent();
  }

  getProvinceFromDropdown(province: Provinces) {
    return cy.get(`div[data-value="${province}"]`);
  }

  firstNameInputText() {
    return this.getElementByCyId("primaryContactFirstName");
  }

  firstNameIsRequiredErrorMessage() {
    return cy.contains("First name is required");
  }

  firstNameIsMoreThan100CharsErrorMessage() {
    return cy.contains("First name must have no more than 100 characters.");
  }

  lastNameIsRequiredErrorMessage() {
    return cy.contains("Last Name is required");
  }

  lastNameIsMoreThan100CharsErrorMessage() {
    return cy.contains("Last name must have no more than 100 characters.");
  }

  emailInputText() {
    return this.getElementByCyId("primaryContactEmail");
  }

  emailIsRequiredErrorMessage() {
    return cy.contains("Email is required");
  }
  emailIsMoreThan100CharsErrorMessage() {
    return cy.contains("Last name must have no more than 100 characters.");
  }
  phoneInputText() {
    return this.getElementByCyId("primaryContactPhone");
  }

  phoneNumberIsRequiredErrorMessage() {
    return cy.contains("Phone Number is required");
  }

  locationNameText() {
    return cy.contains("Location name");
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

  address1MoreThan100CharsErrorMessage() {
    return cy.contains("Address 1 must have no more than 100 characters.");
  }
  address2MoreThan100CharsErrorMessage() {
    return cy.contains("Address 2 must have no more than 100 characters.");
  }

  cityMoreThan100CharsErrorMessage() {
    return cy.contains("City must have no more than 100 characters.");
  }

  locationMoreThan100CharsErrorMessage() {
    return cy.contains("Location name must have no more than 100 characters.");
  }
}
