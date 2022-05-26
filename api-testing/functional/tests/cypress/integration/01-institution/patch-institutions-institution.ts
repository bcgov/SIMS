describe("Institution api", () => {
  it("PATCH - Update institution details", () => {
    cy.fixture("token").then((data) => {
      cy.request({
        method: Cypress.env("patch"),
        url: Cypress.env("update_institution_url"),
        auth: { bearer: data.access_token },
        body: {
          primaryContactEmail: "ryan@gov.bc.ca",
          primaryContactFirstName: "Ryan",
          primaryContactLastName: "Gosling",
          primaryContactPhone: "2382973645",
          mailingAddress: {
            addressLine1: "2285 Blind Bay Road",
            addressLine2: "Chesley",
            city: "Mica Creek",
            country: "Canada",
            postalCode: "V0E 2L0",
            provinceState: "British Columbia",
            canadaPostalCode: "N0G 4K9",
            otherPostalCode: "P2R 3M2",
            selectedCountry: "Canada",
            otherCountry: "",
          },
        },
      }).then((response) => {
        expect(response.isOkStatusCode).to.be.true;
        expect(response.status).to.be.equal(200);
      });
    });
  });
});
