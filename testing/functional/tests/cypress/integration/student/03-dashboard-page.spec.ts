import Welcome from "../../page-objects/student-objects/01-welcome-object"
import Login from "../../page-objects/student-objects/02-login-object"
import Dashboard from "../../page-objects/student-objects/03-dashboard-object"

describe("Dashboard Page", () => {

    const WelcomeObject = new Welcome()
    const LoginObject = new Login()
    const DashboardObject = new Dashboard()

    it("Verify that user successfully redirects to Dashboard Page.", () => {
        cy.visit("/")
        cy.wait(2000)
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((data) => {
            LoginObject.cardSerialNumberInputTxt().type(data.validCardSerialNumber).should('have.value', data.validCardSerialNumber)
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.passcodeInputTxt().type(data.validPasscode).should('have.value', data.validPasscode)
            LoginObject.passcodeContinurBtn()
            LoginObject.verifyLoggedInTxt()
        })
    })

    it("Verify that all buttons are present in Dashboard Page.", () => {
        DashboardObject.verifyAllButtons()
    })

    it("Check that clicking on buttons redirects to appropriate pages.", () => {
        DashboardObject.verifyClickAllButtons()
    })

    it("Verify that user able to successfully log out from browser", () => {
        DashboardObject.verifyLogOff()
    })

    it("Verify that clicking on back button doesn't logout the user once is user is logged in", () => {
        cy.visit("/")
        cy.wait(2000)
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.passcodeInputTxt().type(testdata.validPasscode).should('have.value', testdata.validPasscode)
            LoginObject.passcodeContinurBtn()
            LoginObject.verifyLoggedInTxt()
        })
        DashboardObject.verifyBackBtn()
    })

})