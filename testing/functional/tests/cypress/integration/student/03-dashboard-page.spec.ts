import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"
import LoginObject from "../../page-objects/student-objects/LoginObject"
import DashboardObject from "../../page-objects/student-objects/DashboardObject"

describe("Dashboard Page", () => {

    const Welcome = new WelcomeObject()
    const Login = new LoginObject()
    const Dashboard = new DashboardObject()

    const username = Cypress.env('cardSerialNumber')
    const password = Cypress.env('passcode')

    it("Verify that user successfully redirects to Dashboard Page.", () => {
        cy.visit("/")
        cy.wait(2000)
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.cardSerialNumberContinuebtn()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.passcodeContinurBtn()
        Login.verifyLoggedInTxt()
    })

    it("Verify that all buttons are present in Dashboard Page.", () => {
        Dashboard.verifyAllButtons()
    })

    it("Check that clicking on buttons redirects to appropriate pages.", () => {
        Dashboard.verifyClickAllButtons()
    })

    it("Verify that user able to successfully log out from browser", () => {
        Dashboard.verifyLogOff()
    })

    it("Verify that clicking on back button doesn't logout the user once is user is logged in", () => {
        cy.visit("/")
        cy.wait(2000)
        Welcome.virtualTestingBtn()
        Login.cardSerialNumberInputTxt().type(username).should('have.value', username)
        Login.cardSerialNumberContinuebtn()
        Login.passcodeInputTxt().type(password).should('have.value', password)
        Login.passcodeContinurBtn()
        Login.verifyLoggedInTxt()
        Dashboard.verifyBackBtn()
    })

})