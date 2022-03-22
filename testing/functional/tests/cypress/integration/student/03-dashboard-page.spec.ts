import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"
import LoginObject from "../../page-objects/student-objects/LoginObject"
import DashboardObject from "../../page-objects/student-objects/DashboardObject"

describe("Dashboard Page", () => {

    const welcomeObject = new WelcomeObject()
    const loginObject = new LoginObject()
    const dashboardObject = new DashboardObject()

    const username = Cypress.env('cardSerialNumber')
    const password = Cypress.env('passcode')

    it("Verify that user successfully redirects to Dashboard Page.", () => {
        cy.visit("/")
        cy.wait(2000)
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.cardSerialNumberContinueButton()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.passcodeContinueButton()
        loginObject.verifyLoggedInText()
    })

    it("Verify that all buttons are present in Dashboard Page.", () => {
        dashboardObject.verifyAllButtons()
    })

    it("Check that clicking on buttons redirects to appropriate pages.", () => {
        dashboardObject.verifyClickAllButtons()
    })

    it("Verify that user able to successfully log out from browser", () => {
        dashboardObject.verifyLogOff()
    })

    it("Verify that clicking on back button doesn't logout the user once is user is logged in", () => {
        cy.visit("/")
        cy.wait(2000)
        welcomeObject.virtualTestingButton()
        loginObject.cardSerialNumberInputText().type(username).should('have.value', username)
        loginObject.cardSerialNumberContinueButton()
        loginObject.passcodeInputText().type(password).should('have.value', password)
        loginObject.passcodeContinueButton()
        loginObject.verifyLoggedInText()
        dashboardObject.verifyBackButton()
    })

})