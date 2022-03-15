import Welcome from "../../page-objects/student-objects/01-welcome-object"
import Login from "../../page-objects/student-objects/02-login-object"

describe("Login Page", () => {

    const WelcomeObject = new Welcome()
    const LoginObject = new Login()

    beforeEach(() => {
        cy.visit("/")
        cy.wait(2000)
    })

    it("Verify that user able to login with a valid username and valid password.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.passcodeInputTxt().type(testdata.validPasscode).should('have.value', testdata.validPasscode)
            LoginObject.passcodeContinurBtn()
            LoginObject.verifyLoggedInTxt()
        })
    })

    it("Verify that user is not able to redirect to next page with invalid Card Serial Number in Virtual Card Testing.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.invalidCardSerialNumber)
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.cardNotFoundTxt()
        })
    })

    it("Test with empty Card Serial Number such that it must get failed.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt()
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.emptyCardNumberTxt()
        })
    })

    it("Verify that user can redirect to next page by pressing Enter key after typing in valid Card Serial Number.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.cardSerialNumber).should('have.value', testdata.cardSerialNumber)
            //LoginObject.cardSerialNumberContinuebtn()
            LoginObject.enterKeyFromCardSerialNumber()
            LoginObject.passcodePageTxt()
        })
    })

    it("Verify that Card Serial Number with case sensitivity.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.caseSenstivityCardSerialNumber)
            LoginObject.caseSenstivityCardSerialNumber()

        })
    })

    it("Verify that Card Serial Number must be within 15 digits allowed", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.fifteenDigitCardSerialNumber)
            LoginObject.maxCharacterCardSerialNumber()

        })
    })

    it.skip("Verify that user is not able to redirect to next page with valid Card Serial Number & invalid passcode.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.passcodeInputTxt().type(testdata.invalidPassocde).should('have.value', testdata.invalidPassocde)
            LoginObject.passcodeContinurBtn()
            LoginObject.incorrectPasscodeTxt()
        })
    })

    it.skip("Test with empty passcode after entering valid card serial number such that it must get failed.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.cardSerialNumber).should('have.value', testdata.cardSerialNumber)
            LoginObject.cardSerialNumberContinuebtn()
            LoginObject.passcodeInputTxt().type('  ')
            LoginObject.passcodeContinurBtn()
            LoginObject.whiteSpacePasscodeTxt()
        })
    })

    it("Check a user is able to login by pressing Enter after entered valid Card Serial Number & valid passcode.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.enterKeyFromCardSerialNumber()
            LoginObject.passcodeInputTxt().type(testdata.validPasscode).should('have.value', testdata.validPasscode)
            LoginObject.enterKeyFromPasscode()
            LoginObject.verifyLoggedInTxt()
        })
    })

    it("Verify that password is masked or visible in the form of asterisks.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.enterKeyFromCardSerialNumber()
            LoginObject.passcodeInputTxt().type(testdata.validPasscode).should('have.value', testdata.validPasscode)
            LoginObject.verifyMaskablePassword()
        })
    })

    it("Verify that user remains on same page after login & then relaod page.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.enterKeyFromCardSerialNumber()
            LoginObject.passcodeInputTxt().type(testdata.validPasscode).should('have.value', testdata.validPasscode)
            LoginObject.enterKeyFromPasscode()
            cy.reload()
            LoginObject.verifyLoggedInTxt()
        })
    })

    it("Verify that user remains on same page before login & then relaod page.", () => {
        WelcomeObject.virtualTestingBtn()
        cy.fixture('testdata').then((testdata) => {
            LoginObject.cardSerialNumberInputTxt().type(testdata.validCardSerialNumber).should('have.value', testdata.validCardSerialNumber)
            LoginObject.enterKeyFromCardSerialNumber()
            cy.reload()
            LoginObject.passcodeInputTxt().type(testdata.validPasscode).should('have.value', testdata.validPasscode)
            LoginObject.enterKeyFromPasscode()
            LoginObject.verifyLoggedInTxt()
        })
    })


})