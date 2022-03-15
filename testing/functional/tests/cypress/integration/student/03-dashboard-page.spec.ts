import welcome from "../../page-objects/student-objects/01-welcome-object"
import login from "../../page-objects/student-objects/02-login-object"
import dashboard from "../../page-objects/student-objects/03-dashboard-object"

describe("Dashboard Page", () => {

    const WelcomeObject = new welcome()
    const LoginObject = new login()
    const DashboardObject = new dashboard()

    it("Verify that user successfully redirects to Dashboard Page.", () => {
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