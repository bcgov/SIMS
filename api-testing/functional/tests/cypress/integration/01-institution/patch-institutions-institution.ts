let identity: any;
describe("Institution api", () => {
  it("POST - Token", () => {
    cy.request({
      method: "POST",
      url: Cypress.env("token_url"),
      form: true,
      body: {
        grant_type: Cypress.env("grantType"),
        client_id: Cypress.env("clientId"),
        username: Cypress.env("userName"),
        password: Cypress.env("password"),
      },
    }).then((response) => {
      identity = response;
      window.localStorage.setItem("identity", JSON.stringify(identity));
    });
  });

  it("PATCH - Update institution details", () => {
    cy.fixture("bodyData").then((data) => {
      cy.request({
        method: "PATCH",
        url: Cypress.env("update_institution_url"),
        auth: { bearer: identity.body.access_token },
        body: {
          primaryContactEmail: data.email,
          primaryContactFirstName: data.firstName,
          primaryContactLastName: data.lastName,
          primaryContactPhone: data.contactPhone,
          mailingAddress: {
            addressLine1: data.address1,
            addressLine2: data.address2,
            city: data.cityName,
            country: data.countryName,
            postalCode: data.postalCodeNumber,
            provinceState: data.provinceStateName,
            canadaPostalCode: data.canadaPostal,
            otherPostalCode: data.otherPostal,
            selectedCountry: data.selectedCountryName,
            otherCountry: "",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.equal(200);
      });
    });
  });
});
