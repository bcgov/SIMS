import InstitutionHelperActions from "../02-institution/common-helper-functions.cy";

const institutionHelperActions = new InstitutionHelperActions();

const INSTITUTION_DETAILS_SINGLE_LOCATION =
  institutionHelperActions.getInstitutionDetailsSingleLocation();
const USER_DETAILS_SINGLE_LOCATION =
  institutionHelperActions.getUserDetailsSingleLocation();
const API_URL = institutionHelperActions.getApiUrlForTest();
const TOKEN = institutionHelperActions.getToken();

describe("Validate Institution apis - Institution with single location", () => {
  it("Get User status", () => {
    cy.request({
      method: "GET",
      url: `${API_URL}/institution-user/status`,
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

  it("Get User details", () => {
    cy.request({
      method: "GET",
      url: `${API_URL}/institution-user/my-details`,
      followRedirect: false,
      headers: {
        "Content-Type": "text/html",
        Authorization: TOKEN,
      },
    }).then((resp) => {
      expect(resp.status).to.be.equal(200);
      expect(resp.body.user).to.have.property(
        "userName",
        USER_DETAILS_SINGLE_LOCATION.userName
      );
      expect(resp.body.user).to.have.property(
        "firstName",
        USER_DETAILS_SINGLE_LOCATION.firstName
      );
      expect(resp.body.user).to.have.property(
        "lastName",
        USER_DETAILS_SINGLE_LOCATION.lastName
      );
      expect(resp.body.user).to.have.property("isActive", true);
      expect(resp.body.user).to.have.property(
        "userFullName",
        USER_DETAILS_SINGLE_LOCATION.userFullName
      );
      expect(resp.body.user).to.have.property("isAdmin", true);
      expect(resp.body.user).to.have.property(
        "email",
        USER_DETAILS_SINGLE_LOCATION.email
      );
      expect(resp.body.authorizations).to.have.property(
        "institutionId",
        USER_DETAILS_SINGLE_LOCATION.authorizations.institutionId
      );
      expect(resp.body.authorizations.authorizations[0]).to.have.property(
        "locationId",
        USER_DETAILS_SINGLE_LOCATION.authorizations.authorizations[0].locationId
      );
      expect(resp.body.authorizations.authorizations[0]).to.have.property(
        "userType",
        USER_DETAILS_SINGLE_LOCATION.authorizations.authorizations[0].userType
      );
      expect(resp.body.authorizations.authorizations[0]).to.have.property(
        "userRole",
        USER_DETAILS_SINGLE_LOCATION.authorizations.authorizations[0].userRole
      );
    });
  });

  it("Get Institution details", () => {
    cy.request({
      method: "GET",
      url: `${API_URL}/institution`,
      followRedirect: true,
      headers: {
        "Content-Type": "text/html",
        Authorization: TOKEN,
      },
    }).then((response) => {
      const body = response.body;
      const mailingAddress = body.mailingAddress;
      expect(response.status).to.be.equal(200);
      expect(body).to.have.property(
        "establishedDate",
        INSTITUTION_DETAILS_SINGLE_LOCATION.establishedDate
      );

      expect(body).to.have.property(
        "formattedEstablishedDate",
        INSTITUTION_DETAILS_SINGLE_LOCATION.formattedEstablishedDate
      );
      expect(body).to.have.property(
        "hasBusinessGuid",
        INSTITUTION_DETAILS_SINGLE_LOCATION.hasBusinessGuid
      );
      expect(body).to.have.property(
        "institutionType",
        INSTITUTION_DETAILS_SINGLE_LOCATION.institutionType
      );
      expect(body).to.have.property(
        "institutionTypeName",
        INSTITUTION_DETAILS_SINGLE_LOCATION.institutionTypeName
      );
      expect(body).to.have.property(
        "isBCPrivate",
        INSTITUTION_DETAILS_SINGLE_LOCATION.isBCPrivate
      );
      expect(body).to.have.property(
        "legalOperatingName",
        INSTITUTION_DETAILS_SINGLE_LOCATION.legalOperatingName
      );
      expect(mailingAddress).to.have.property(
        "addressLine1",
        INSTITUTION_DETAILS_SINGLE_LOCATION.mailingAddress.addressLine1
      );
      expect(mailingAddress).to.have.property(
        "addressLine2",
        INSTITUTION_DETAILS_SINGLE_LOCATION.mailingAddress.addressLine2
      );
      expect(mailingAddress).to.have.property(
        "canadaPostalCode",
        INSTITUTION_DETAILS_SINGLE_LOCATION.mailingAddress.canadaPostalCode
      );
      expect(mailingAddress).to.have.property(
        "city",
        INSTITUTION_DETAILS_SINGLE_LOCATION.mailingAddress.city
      );
      expect(mailingAddress).to.have.property(
        "postalCode",
        INSTITUTION_DETAILS_SINGLE_LOCATION.mailingAddress.postalCode
      );
      expect(mailingAddress).to.have.property(
        "provinceState",
        INSTITUTION_DETAILS_SINGLE_LOCATION.mailingAddress.provinceState
      );
      expect(mailingAddress).to.have.property(
        "selectedCountry",
        INSTITUTION_DETAILS_SINGLE_LOCATION.mailingAddress.selectedCountry
      );
      expect(body).to.have.property(
        "operatingName",
        INSTITUTION_DETAILS_SINGLE_LOCATION.operatingName
      );
      expect(body).to.have.property(
        "primaryContactEmail",
        INSTITUTION_DETAILS_SINGLE_LOCATION.primaryContactEmail
      );
      expect(body).to.have.property(
        "primaryContactFirstName",
        INSTITUTION_DETAILS_SINGLE_LOCATION.primaryContactFirstName
      );
      expect(body).to.have.property(
        "primaryContactLastName",
        INSTITUTION_DETAILS_SINGLE_LOCATION.primaryContactLastName
      );
      expect(body).to.have.property(
        "primaryContactPhone",
        INSTITUTION_DETAILS_SINGLE_LOCATION.primaryContactPhone
      );
      expect(body).to.have.property(
        "primaryEmail",
        INSTITUTION_DETAILS_SINGLE_LOCATION.primaryEmail
      );
      expect(body).to.have.property(
        "primaryPhone",
        INSTITUTION_DETAILS_SINGLE_LOCATION.primaryPhone
      );
      expect(body).to.have.property(
        "regulatingBody",
        INSTITUTION_DETAILS_SINGLE_LOCATION.regulatingBody
      );
      expect(body).to.have.property(
        "website",
        INSTITUTION_DETAILS_SINGLE_LOCATION.website
      );
    });
  });
});
