import data from "../../e2e/data/institution/manage-location.json";

enum ErrorTypes {
  fieldIsMandatory = 1,
  fieldContainsMoreThanAllowedChars = 2,
}
export default class BaseMethods {
  /**
   *
   * @param cyId data-cy id for the Element
   * @returns Cypress.Chainable<JQuery<HTMLElement>>
   */
  getElementByCyId(cyId: string) {
    cy.get(`[data-cy='${cyId}']`).scrollIntoView();
    return cy.get(`[data-cy='${cyId}']`);
  }

  /**
   *
   * @param fieldName Field Name that needs to be in the error message
   * @param errorType What kind of error message to be constructed
   * @returns The complete error message
   */
  errorMessageConstructor(fieldName: string, errorType: ErrorTypes) {
    const fieldNameTrimmed = fieldName.trim();
    switch (errorType) {
      case 1:
        return `${fieldNameTrimmed} is required`;
      case 2:
        return `${fieldNameTrimmed} must have no more than 100 characters`;
    }
  }

  /**
   *
   * @param element Cypress.Chainable<JQuery<HTMLElement>>
   * @param shouldBeEnabled Default set to false
   */
  verifyThatElementIsVisibleAndIsEnabled(
    element: Cypress.Chainable<JQuery<HTMLElement>>,
    shouldBeEnabled?: boolean
  ) {
    if (shouldBeEnabled) {
      element.should("be.visible").should("not.be.disabled");
    } else {
      element.should("be.visible").should("have.attr", "disabled", "disabled");
    }
  }

  /**
   *
   * @param element Cypress.Chainable<JQuery<HTMLElement>>
   * @param fieldName Name of the field to be validated
   * @param noOfCharsToBeValidated
   */
  verifyThatFieldDoesNotAcceptMoreThanSpecificChars(
    element: Cypress.Chainable<JQuery<HTMLElement>>,
    fieldName: string,
    noOfCharsToBeValidated?: number
  ) {
    if (noOfCharsToBeValidated == 100) {
      const errorMessage = this.errorMessageConstructor(
        fieldName,
        ErrorTypes.fieldContainsMoreThanAllowedChars
      );
      element.clear().type(data.invalidData.stringWithMoreThan100Chars);
      cy.contains(`${errorMessage}`);
    }
  }

  /**
   *
   * @param element Cypress.Chainable<JQuery<HTMLElement>>
   * @param fieldName Name of the field to be validated
   * @param checkForErrorMessage Checks for the error message preset or not, default is true
   */
  verifyThatFieldShouldNotBeEmpty(
    element: Cypress.Chainable<JQuery<HTMLElement>>,
    fieldName: string,
    checkForErrorMessage?: true
  ) {
    element.clear();
    this.getElementByCyId("primaryFooterButton").click();
    if (checkForErrorMessage) {
      const errorMessage = this.errorMessageConstructor(
        fieldName,
        ErrorTypes.fieldIsMandatory
      );
      cy.contains(`${errorMessage}`);
    }
  }

  /**
   *
   * @param element
   * @param dropDownOption
   */
  verifyTheDropDownOptionsAreVisible(
    element: Cypress.Chainable<JQuery<HTMLElement>>,
    dropDownOption: string
  ) {
    element.get(`[data-value='${dropDownOption}']`).should("be.visible");
  }
}
