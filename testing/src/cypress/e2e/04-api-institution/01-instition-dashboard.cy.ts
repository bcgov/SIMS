const COLLEGE_F = Cypress.env("COLL_F");
const USER_F = Cypress.env("USERS").coll_f;
const BASE_URL = Cypress.env("TEST").BASE_URL + "/api/institutions";
const TOKEN = Cypress.env("TEST").TOKEN;

describe("Institution apis", () => {
  it("Get user status", () => {
    cy.request({
      method: "GET",
      url: `${BASE_URL}/institution-user/status`,
      followRedirect: false,
      headers: {
        "Content-Type": "text/html",
        Authorization: TOKEN,
      },
    }).then((response) => {
      expect(response.status).to.be.equal(200);
      expect(response.body).to.have.property("isExistingUser", true);
      expect(response.body).to.have.property("isActiveUser", true);
    });
  });

  it("Get user details", () => {
    cy.request({
      method: "GET",
      url: `${BASE_URL}/institution-user/my-details`,
      followRedirect: false,
      headers: {
        "Content-Type": "text/html",
        Authorization: TOKEN,
      },
    }).then((resp) => {
      expect(resp.status).to.be.equal(200);
      expect(resp.body.user).to.have.property("userName", USER_F.userName);
      expect(resp.body.user).to.have.property("firstName", USER_F.firstName);
      expect(resp.body.user).to.have.property("lastName", USER_F.lastName);
      expect(resp.body.user).to.have.property("isActive", true);
      expect(resp.body.user).to.have.property(
        "userFullName",
        USER_F.userFullName
      );
      expect(resp.body.user).to.have.property("isAdmin", true);
      expect(resp.body.user).to.have.property("email", USER_F.email);
      expect(resp.body.authorizations).to.have.property(
        "institutionId",
        USER_F.authorizations.institutionId
      );
      expect(resp.body.authorizations.authorizations[0]).to.have.property(
        "locationId",
        USER_F.authorizations.authorizations[0].locationId
      );
      expect(resp.body.authorizations.authorizations[0]).to.have.property(
        "userType",
        USER_F.authorizations.authorizations[0].userType
      );
      expect(resp.body.authorizations.authorizations[0]).to.have.property(
        "userRole",
        USER_F.authorizations.authorizations[0].userRole
      );
    });
  });

  it("Get institution details", () => {
    cy.request({
      method: "GET",
      url: `${BASE_URL}/institution`,
      followRedirect: true,
      headers: {
        "Content-Type": "text/html",
        Authorization: TOKEN,
      },
    }).then((resp) => {
      const body = resp.body;
      const addr = body.mailingAddress;
      expect(resp.status).to.be.equal(200);
      expect(body).to.have.property(
        "establishedDate",
        COLLEGE_F.establishedDate
      );

      expect(body).to.have.property(
        "formattedEstablishedDate",
        COLLEGE_F.formattedEstablishedDate
      );
      expect(body).to.have.property(
        "hasBusinessGuid",
        COLLEGE_F.hasBusinessGuid
      );
      expect(body).to.have.property(
        "institutionType",
        COLLEGE_F.institutionType
      );
      expect(body).to.have.property(
        "institutionTypeName",
        COLLEGE_F.institutionTypeName
      );
      expect(body).to.have.property("isBCPrivate", COLLEGE_F.isBCPrivate);
      expect(body).to.have.property(
        "legalOperatingName",
        COLLEGE_F.legalOperatingName
      );
      expect(addr).to.have.property(
        "addressLine1",
        COLLEGE_F.mailingAddress.addressLine1
      );
      expect(addr).to.have.property(
        "addressLine2",
        COLLEGE_F.mailingAddress.addressLine2
      );
      expect(addr).to.have.property(
        "canadaPostalCode",
        COLLEGE_F.mailingAddress.canadaPostalCode
      );
      expect(addr).to.have.property("city", COLLEGE_F.mailingAddress.city);
      expect(addr).to.have.property(
        "postalCode",
        COLLEGE_F.mailingAddress.postalCode
      );
      expect(addr).to.have.property(
        "provinceState",
        COLLEGE_F.mailingAddress.provinceState
      );
      expect(addr).to.have.property(
        "selectedCountry",
        COLLEGE_F.mailingAddress.selectedCountry
      );
      expect(body).to.have.property("operatingName", COLLEGE_F.operatingName);
      expect(body).to.have.property(
        "primaryContactEmail",
        COLLEGE_F.primaryContactEmail
      );
      expect(body).to.have.property(
        "primaryContactFirstName",
        COLLEGE_F.primaryContactFirstName
      );
      expect(body).to.have.property(
        "primaryContactLastName",
        COLLEGE_F.primaryContactLastName
      );
      expect(body).to.have.property(
        "primaryContactPhone",
        COLLEGE_F.primaryContactPhone
      );
      expect(body).to.have.property("primaryEmail", COLLEGE_F.primaryEmail);
      expect(body).to.have.property("primaryPhone", COLLEGE_F.primaryPhone);
      expect(body).to.have.property("regulatingBody", COLLEGE_F.regulatingBody);
      expect(body).to.have.property("website", COLLEGE_F.website);
    });
  });
});
