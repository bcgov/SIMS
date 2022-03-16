class Dashboard {

    applicationBtn() {
        return cy.xpath("//button[normalize-space()='Applications']").should('be.visible').click()
    }

    notificationBtn() {
        return cy.xpath("//button[normalize-space()='Notifications']").should('be.visible').click()
    }

    fileUploaderBtn() {
        return cy.xpath("//button[normalize-space()='File Uploader']").should('be.visible').click()
    }

    profileBtn() {
        return cy.xpath("//button[normalize-space()='Profile']").should('be.visible').click()
    }

    personIconBtn() {
        return cy.xpath("//button[contains(@class,'v-btn--size-default mr-5')]").should('be.visible').click()
    }

    startApplicationBtn() {
        return cy.xpath("//button[normalize-space()='Start application']").should('be.visible').click()
    }

    manageLoanBtn() {
        return cy.xpath("//button[@name='data[manageLoan]']").should('be.visible').click()
    }

    verifyAllButtons() {
        cy.xpath("//button[normalize-space()='Applications']").should('be.visible')
        cy.xpath("//button[normalize-space()='Notifications']").should('be.visible')
        cy.xpath("//button[normalize-space()='File Uploader']").should('be.visible')
        cy.xpath("//button[normalize-space()='Profile']").should('be.visible')
        cy.xpath("//button[contains(@class,'v-btn--size-default mr-5')]").should('be.visible')
        cy.xpath("//button[normalize-space()='Start application']").should('be.visible')
        cy.xpath("//button[@name='data[manageLoan]']").should('be.visible')
        cy.wait(2000)
    }

    public verifyClickAllButtons() {
        cy.xpath("//button[normalize-space()='Applications']").should('be.visible').click()
        cy.contains("My Applications").should('be.visible')
        cy.wait(2000)
        cy.xpath("//button[normalize-space()='Notifications']").should('be.visible').click()
        cy.contains("Notifications").should('be.visible')
        cy.wait(2000)
        cy.xpath("//button[normalize-space()='File Uploader']").should('be.visible').click()
        cy.contains('File uploader').should('be.visible')
        cy.wait(2000)
        cy.xpath("//button[normalize-space()='Profile']").should('be.visible').click()
        cy.contains('Student Information').should('be.visible')
        cy.wait(2000)
        cy.xpath("//button[contains(@class,'v-btn--size-default mr-5')]").should('be.visible').click()
        cy.contains('Notifications Settings').should('be.visible')
        cy.wait(2000)
    }

    verifyLogOff() {
        cy.xpath("//button[contains(@class,'v-btn--size-default mr-5')]").should('be.visible').click()
        cy.contains('Log off').click()
        cy.wait(2000)
        cy.contains('Welcome to StudentAid BC').should('be.visible')
    }

    verifyBackBtn() {
        cy.go('back')
        cy.contains('Enter Your Passcode').should('not.exist')
    }

    clickOnDraftStatus() {
        cy.get('//tbody/tr/td[5]').each(($el) => {

            if ($el.text() === 'Draft') {
                $el.click()
            }
        })
    }
}
export default Dashboard