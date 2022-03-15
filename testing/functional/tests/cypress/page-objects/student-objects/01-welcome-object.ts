class welcome {

    checkCurrentUrl() {
        cy.url().should('include', 'https://test-aest-sims.apps.silver.devops.gov.bc.ca/student')
        cy.wait(2000)
        return
    }

    getWelcomeText() {
        cy.contains("Welcome to StudentAid BC")
        cy.wait(2000)
        return
    }

    loginWithBCSCBtn() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible")
        cy.wait(2000)
        return
    }

    signUpWithBCSCBtn() {
        cy.xpath("//button[normalize-space()='Sign Up with BCSC']").should("be.visible")
        cy.wait(2000)
        return
    }

    verifyLoginBtn() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.contains('Log in to: SIMS - Test')
        cy.wait(2000)
        return
    }

    verifySignUpBtn() {
        cy.xpath("//button[normalize-space()='Sign Up with BCSC']").should("be.visible").click()
        cy.contains('Log in to: SIMS - Test')
        cy.wait(2000)
        return
    }

    verifySetUpBtn() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.get('#cardtap-get-setup-btn').should('be.visible').click()
        cy.wait(2000)
        return
    }

    cancelLoginBtn() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.get('#cancelLoginLnk').should('be.visible').click()
        cy.wait(2000)
        return
    }

    bcServicesCardAppBtn() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.contains('BC Services Card app').should('be.visible')
        cy.get('#tile_remote_mobile_card_device_div_id').click()
        cy.contains('Enter this pairing code in the BC Services Card app.').should('be.visible')
        cy.wait(2000)
        return
    }

    virtualTestingBtn() {
        cy.xpath("//button[normalize-space()='Login with BCSC']").should("be.visible").click()
        cy.contains('Virtual testing').should('be.visible')
        cy.wait(2000)
        cy.get('#tile_btn_virtual_device_div_id > h2').click({force:true})
        //cy.contains('Card Serial Number').should('be.visible')
        cy.wait(2000)
        return
    }

}
export default welcome