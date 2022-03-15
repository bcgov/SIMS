class Login {

    cardSerialNumberInputTxt() {
        return cy.get('#csn')
    }

    cardSerialNumberContinuebtn() {
        cy.get('#continue').click()
        cy.wait(2000)
    }

    passcodeInputTxt() {
        return cy.get('#passcode')
    }

    passcodeContinurBtn() {
        cy.get('#btnSubmit').click()
        cy.wait(2000)
    }

    verifyLoggedInTxt() {
        cy.contains('Hello!')
        cy.wait(2000)
    }

    cardNotFoundTxt() {
        cy.contains('Card Not Found')
        cy.wait(2000)
    }

    emptyCardNumberTxt() {
        cy.contains('Enter the card serial number')
        cy.wait(2000)
    }

    enterKeyFromCardSerialNumber() {
        cy.get('#csn')
            .should('be.visible')
            .type('{enter}')
        cy.wait(2000)
    }

    enterKeyFromPasscode() {
        cy.wait(2000)
        cy.get('#passcode')
            .should('be.visible')
            .type('{enter}')
    }

    passcodePageTxt(){
        cy.contains('Enter Your Passcode')
        cy.wait(2000)
    }

    maxCharacterCardSerialNumber(){
        cy.xpath("//input[@maxlength='15']").should('be.visible')
    }

    caseSenstivityCardSerialNumber(){
        cy.get("input#csn.form-control.text-uppercase").should('be.visible')
    }

    incorrectPasscodeTxt(){
        cy.contains('Please re-enter your passcode').should('be.visible')
    }

    whiteSpacePasscodeTxt(){
        cy.contains('Please try again later').should('be.visible')
    }

    wait(){
        cy.wait(4000)
    }

    verifyMaskablePassword(){
        cy.xpath("//input[@type='password']").should('be.visible')
        cy.wait(2000)
    }

    verifyFocusCardSerialNumber(){
        cy.get('#csn').focus()
        //cy.xpath("//input[@type='password']").focus()
    }
}
export default Login