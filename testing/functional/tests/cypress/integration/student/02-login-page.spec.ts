import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"
import LoginObject from "../../page-objects/student-objects/LoginObject"

describe("Login Page", () => {

    const welcomeObject = new WelcomeObject()
    const loginObject = new LoginObject()

    const username = Cypress.env('cardSerialNumber')
    const password = Cypress.env('passcode')
    const invalidUsername = Cypress.env('invalidCardSerialNumber')
    const invalidPassword = Cypress.env('invalidPasscode')
    const caseUsername = Cypress.env('caseSensitivityCardSerialNumber')
    const fifteenUsername = Cypress.env('fifteenCardSerialNumber')

    beforeEach(() => {
        cy.visit("/")
        cy.wait(2000)
    })

    it("Verify that user able to login with a valid username and valid password.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.cardSerialNumberContinueButton()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.passcodeContinueButton()
        loginObject.verifyLoggedInText()

    })

    it("Verify that user is not able to redirect to next page with invalid Card Serial Number in Virtual Card Testing.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(invalidUsername)
        loginObject.cardSerialNumberContinueButton()
        loginObject.cardNotFoundText()
    })

    it("Test with empty Card Serial Number such that it must get failed.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText()
        loginObject.cardSerialNumberContinueButton()
        loginObject.emptyCardNumberText()
    })

    it("Verify that user can redirect to next page by pressing Enter key after typing in valid Card Serial Number.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.enterKeyFromCardSerialNumber()
        loginObject.passcodePageText()
    })

    it("Verify that Card Serial Number with case sensitivity.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(caseUsername)
        loginObject.caseSenstivityCardSerialNumber()
    })

    it("Verify that Card Serial Number must be within 15 digits allowed", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(fifteenUsername)
        loginObject.maxCharacterCardSerialNumber()
    })

    it.skip("Verify that user is not able to redirect to next page with valid Card Serial Number & invalid passcode.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.cardSerialNumberContinueButton()
        loginObject.passcodeInputText().type(invalidPassword).should('have.value', invalidPassword)
        loginObject.passcodeContinueButton()
        loginObject.incorrectPasscodeText()
    })

    it.skip("Test with empty passcode after entering valid card serial number such that it must get failed.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.cardSerialNumberContinueButton()
        loginObject.passcodeInputText().type('  ')
        loginObject.passcodeContinueButton()
        loginObject.whiteSpacePasscodeText()
    })

    it("Check a user is able to loginObject by pressing Enter after entered valid Card Serial Number & valid passcode.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.enterKeyFromCardSerialNumber()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.enterKeyFromPasscode()
        loginObject.verifyLoggedInText()
    })

    it("Verify that password is masked or visible in the form of asterisks.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.enterKeyFromCardSerialNumber()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.verifyMaskablePassword()
    })

    it("Verify that user remains on same page after loginObject & then reload page.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.enterKeyFromCardSerialNumber()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.enterKeyFromPasscode()
        cy.reload()
        loginObject.verifyLoggedInText()
    })

    it("Verify that user remains on same page before loginObject & then reload page.", () => {
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.enterKeyFromCardSerialNumber()
        cy.reload()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.enterKeyFromPasscode()
        loginObject.verifyLoggedInText()
    })


})