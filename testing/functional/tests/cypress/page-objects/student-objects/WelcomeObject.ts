export default class WelcomeObject {

    checkCurrentUrl() {
        cy.url().should('include', 'https://test-aest-sims.apps.silver.devops.gov.bc.ca/student')
        cy.wait(2000)
    }

    getWelcomeText() {
        cy.contains("Welcome to StudentAid BC")
        cy.wait(2000)
    }

    loginWithBCSCButton() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible")
        cy.wait(2000)
    }

    signUpWithBCSCButton() {
        cy.xpath("//button[normalize-space()='Sign Up with BCSC']").should("be.visible")
        cy.wait(2000)
    }

    verifyLoginButton() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.contains('Log in to: SIMS - Test')
        cy.wait(2000)
    }

    verifySignUpButton() {
        cy.xpath("//button[normalize-space()='Sign Up with BCSC']").should("be.visible").click()
        cy.contains('Log in to: SIMS - Test')
        cy.wait(2000)
    }

    verifySetUpButton() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.get('#cardtap-get-setup-btn').should('be.visible').click()
        cy.wait(2000)
    }

    cancelLoginButton() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.get('#cancelLoginLnk').should('be.visible').click()
        cy.wait(2000)
    }

    bcServicesCardAppButton() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.contains('BC Services Card app').should('be.visible')
        cy.get('#tile_remote_mobile_card_device_div_id').click()
        cy.contains('Enter this pairing code in the BC Services Card app.').should('be.visible')
        cy.wait(2000)
    }

    virtualTestingButton() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.contains('Virtual testing').should('be.visible')
        cy.wait(2000)
        cy.get('#tile_btn_virtual_device_div_id > h2').click({ force: true })
        cy.wait(2000)
    }

}