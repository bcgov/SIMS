import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import Authorization from "../../custom-command/common/authorization";
import { ClientId } from "../../custom-command/common/authorization";
const institutionHelperActions = new InstitutionHelperActions();

const INSTITUTION_DETAILS_SINGLE_LOCATION =
  institutionHelperActions.getInstitutionDetailsSingleLocation();
const USER_DETAILS_SINGLE_LOCATION =
  institutionHelperActions.getUserDetailsSingleLocation();
const API_URL = institutionHelperActions.getApiUrlForTest();
const TOKEN_URL = institutionHelperActions.getApiUrlForKeyCloakToken();
const USERNAME = institutionHelperActions.getUserNameForApiTest();
const PASSWORD = institutionHelperActions.getUserPasswordForApiTest();

describe("[Institution Dashboard APIs] - Institution with single location", () => {
  let token: string;
  before(async () => {
    const authorizer = new Authorization();
    token = await authorizer.getAuthToken(
      USERNAME,
      PASSWORD,
      ClientId.INSTITUTION,
      TOKEN_URL
    );
  });
  it("Verify GET `user-status` call", () => {
    cy.request({
      method: "GET",
      url: `${API_URL}/institution-user/status`,
      followRedirect: false,
      headers: {
        "Content-Type": "text/html",
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      expect(response.status).to.be.equal(200);
      expect(response.body).to.have.property("isExistingUser", true);
      expect(response.body).to.have.property("isActiveUser", true);
    });
  });

  it("Verify GET `user-details` call", () => {
    cy.request({
      method: "GET",
      url: `${API_URL}/institution-user/my-details`,
      followRedirect: false,
      headers: {
        "Content-Type": "text/html",
        Authorization: `Bearer ${token}`,
      },
    }).then((resp) => {
      expect(resp.status).to.be.equal(200);
      expect(resp.body.user).to.have.property(
        "userName",
        USER_DETAILS_SINGLE_LOCATION.user.userName
      );
      expect(resp.body.user).to.have.property(
        "firstName",
        USER_DETAILS_SINGLE_LOCATION.user.firstName
      );
      expect(resp.body.user).to.have.property(
        "lastName",
        USER_DETAILS_SINGLE_LOCATION.user.lastName
      );
      expect(resp.body.user).to.have.property("isActive", true);
      expect(resp.body.user).to.have.property(
        "userFullName",
        USER_DETAILS_SINGLE_LOCATION.user.userFullName
      );
      expect(resp.body.user).to.have.property("isAdmin", true);
      expect(resp.body.user).to.have.property(
        "email",
        USER_DETAILS_SINGLE_LOCATION.user.email
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

  //TODO Need to implement test case for user which does not have first name
  //TODO Need to implement test case for user which have access to more than one location
  //TODO Need to implement test case for institution having more than one location
  //TODO Need to implement test case for institution having location outside Canada

  it("Verify GET `Institution-details call", () => {
    cy.request({
      method: "GET",
      url: `${API_URL}/institution`,
      followRedirect: true,
      headers: {
        "Content-Type": "text/html",
        Authorization: `Bearer ${token}`,
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
      expect(body).to.have.property("primaryContactEmail");
      expect(body).to.have.property("primaryContactFirstName");
      expect(body).to.have.property("primaryContactLastName");
      expect(body).to.have.property(
        "primaryContactPhone",
        INSTITUTION_DETAILS_SINGLE_LOCATION.primaryContactPhone
      );
      expect(body).to.have.property("primaryEmail");
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
