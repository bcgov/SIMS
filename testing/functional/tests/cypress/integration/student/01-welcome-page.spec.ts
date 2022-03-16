import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"

describe("Welcome Page", () => {

    const welcome = new WelcomeObject()
    beforeEach(function () {
        cy.visit("/")
    })

    it("Validate student URL", () => {
        welcome.checkCurrentUrl()
    })

    it("Validate welcome page", () => {
        welcome.getWelcomeText()
    })

    it("Validate Login with BCSC & Sign Up with BCSC buttons are visible", () => {
        welcome.loginWithBCSCBtn()
        welcome.signUpWithBCSCBtn()
    })

    it("Verify that clicking on Login with BCSC button redirects to appropriate page or not", () => {
        welcome.verifyLoginBtn()
    })

    it("Verify that clicking on Sign Up with BCSC button redirects to appropriate page or not", () => {
        welcome.verifySignUpBtn()
    })

    it("Verify that Setup BC Service card button redirects to appropriate page or not", () => {
        welcome.verifySetUpBtn()
    })

    it("Verify that cancel login link redirects to appropriate page or not", () => {
        welcome.cancelLoginBtn()
    })

    it("Verify that BC Service card button redirects to appropriate page or not", () => {
        welcome.bcServicesCardAppBtn()
    })

    it("Verify that virtual testing button redirects to appropriate page or not", () => {
        welcome.virtualTestingBtn()
    })

})