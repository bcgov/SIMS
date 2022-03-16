import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"
import LoginObject from "../../page-objects/student-objects/LoginObject"

describe("Login Page", () => {

    const Welcome = new WelcomeObject()
    const Login = new LoginObject()

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
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.cardSerialNumberContinuebtn()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.passcodeContinurBtn()
        Login.verifyLoggedInTxt()

    })

    it("Verify that user is not able to redirect to next page with invalid Card Serial Number in Virtual Card Testing.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(invalidUsername)
        Login.cardSerialNumberContinuebtn()
        Login.cardNotFoundTxt()
    })

    it("Test with empty Card Serial Number such that it must get failed.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt()
        Login.cardSerialNumberContinuebtn()
        Login.emptyCardNumberTxt()
    })

    it("Verify that user can redirect to next page by pressing Enter key after typing in valid Card Serial Number.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        //Login.cardSerialNumberContinuebtn()
        Login.enterKeyFromCardSerialNumber()
        Login.passcodePageTxt()
    })

    it("Verify that Card Serial Number with case sensitivity.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(caseUsername)
        Login.caseSenstivityCardSerialNumber()
    })

    it("Verify that Card Serial Number must be within 15 digits allowed", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(fifteenUsername)
        Login.maxCharacterCardSerialNumber()
    })

    it.skip("Verify that user is not able to redirect to next page with valid Card Serial Number & invalid passcode.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.cardSerialNumberContinuebtn()
        Login.passcodeInputTxt().type(invalidPassword).should('have.value', invalidPassword)
        Login.passcodeContinurBtn()
        Login.incorrectPasscodeTxt()
    })

    it.skip("Test with empty passcode after entering valid card serial number such that it must get failed.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.cardSerialNumberContinuebtn()
        Login.passcodeInputTxt().type('  ')
        Login.passcodeContinurBtn()
        Login.whiteSpacePasscodeTxt()
    })

    it("Check a user is able to login by pressing Enter after entered valid Card Serial Number & valid passcode.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.enterKeyFromCardSerialNumber()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.enterKeyFromPasscode()
        Login.verifyLoggedInTxt()
    })

    it("Verify that password is masked or visible in the form of asterisks.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.enterKeyFromCardSerialNumber()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.verifyMaskablePassword()
    })

    it("Verify that user remains on same page after login & then reload page.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.enterKeyFromCardSerialNumber()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.enterKeyFromPasscode()
        cy.reload()
        Login.verifyLoggedInTxt()
    })

    it("Verify that user remains on same page before login & then reload page.", () => {
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.enterKeyFromCardSerialNumber()
        cy.reload()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.enterKeyFromPasscode()
        Login.verifyLoggedInTxt()
    })


})