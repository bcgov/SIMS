import { updateData } from "../../../data/dev/institution-data/institutionUpdateData";
let identity: any;
describe("Institution api", () => {
  beforeEach("POST - Token", () => {
    cy.request({
      method: "POST",
      url: Cypress.env("token_url"),
      form: true,
      body: {
        grant_type: Cypress.env("institutionGrantType"),
        client_id: Cypress.env("institutionClientId"),
        username: Cypress.env("institutionUserName"),
        password: Cypress.env("institutionPassword"),
      },
    }).then((response) => {
      identity = response;
      window.localStorage.setItem("identity", JSON.stringify(identity));
    });
  });

  it("PATCH - Update institution details", () => {
    cy.request({
      method: "PATCH",
      url: Cypress.env("update_institution_url"),
      auth: { bearer: identity.body.access_token },
      body: {
        primaryContactEmail: updateData.email,
        primaryContactFirstName: updateData.firstName,
        primaryContactLastName: updateData.lastName,
        primaryContactPhone: updateData.contactPhone,
        mailingAddress: {
          addressLine1: updateData.address1,
          addressLine2: updateData.address2,
          city: updateData.cityName,
          country: updateData.countryName,
          postalCode: updateData.postalCodeNumber,
          provinceState: updateData.provinceStateName,
          canadaPostalCode: updateData.canadaPostal,
          otherPostalCode: updateData.otherPostal,
          selectedCountry: updateData.selectedCountryName,
          otherCountry: "",
        },
      },
    }).then((response) => {
      expect(response.status).to.be.equal(200);
    });
  });
});
