import WelcomeObject from "../../page-objects/student-objects/WelcomeObject"

describe("Welcome Page", () => {

    const welcomeObject = new WelcomeObject()
    beforeEach(function () {
        cy.visit("/")
    })

    it("Validate student URL", () => {
        welcomeObject.checkCurrentUrl()
    })

    it("Validate welcomeObject page", () => {
        welcomeObject.getWelcomeText()
    })

    it("Validate Login with BCSC & Sign Up with BCSC buttons are visible", () => {
        welcomeObject.loginWithBCSCButton()
        welcomeObject.signUpWithBCSCButton()
    })

    it("Verify that clicking on Login with BCSC button redirects to appropriate page or not", () => {
        welcomeObject.verifyLoginButton()
    })

    it("Verify that clicking on Sign Up with BCSC button redirects to appropriate page or not", () => {
        welcomeObject.verifySignUpButton()
    })

    it("Verify that Setup BC Service card button redirects to appropriate page or not", () => {
        welcomeObject.verifySetUpButton()
    })

    it("Verify that cancel login link redirects to appropriate page or not", () => {
        welcomeObject.cancelLoginButton()
    })

    it("Verify that BC Service card button redirects to appropriate page or not", () => {
        welcomeObject.bcServicesCardAppButton()
    })

    it("Verify that virtual testing button redirects to appropriate page or not", () => {
        welcomeObject.virtualTestingButton()
    })

})