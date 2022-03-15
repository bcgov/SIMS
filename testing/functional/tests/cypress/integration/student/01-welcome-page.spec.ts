import welcome from "../../page-objects/student-objects/01-welcome-object"

describe("Welcome Page", () => {

    const WelcomeObject = new welcome()
    beforeEach(function () {
        cy.visit("/")
    })

    it("Validate student URL",()=>{
        WelcomeObject.checkCurrentUrl()
    })

    it("Validate welcome page", () => {
        WelcomeObject.getWelcomeText()
    })

    it("Validate Login with BCSC & Sign Up with BCSC buttons are visible",()=>{
        WelcomeObject.loginWithBCSCBtn()
        WelcomeObject.signUpWithBCSCBtn()
    })

    it("Verify that clicking on Login with BCSC button redirects to appropriate page or not",()=>{
        WelcomeObject.verifyLoginBtn()
    })

    it("Verify that clicking on Sign Up with BCSC button redirects to appropriate page or not",()=>{
        WelcomeObject.verifySignUpBtn()
    })

    it("Verify that Setup BC Service card button redirects to appropriate page or not",()=>{
        WelcomeObject.verifySetUpBtn()
    })

    it("Verify that cancel login link redirects to appropriate page or not",()=>{
        WelcomeObject.cancelLoginBtn()
    })

    it("Verify that BC Service card button redirects to appropriate page or not",()=>{
        WelcomeObject.bcServicesCardAppBtn()
    })

    it("Verify that virtual testing button redirects to appropriate page or not",()=>{
        WelcomeObject.virtualTestingBtn()
    })

})