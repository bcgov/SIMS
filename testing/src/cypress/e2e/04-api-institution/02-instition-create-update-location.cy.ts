import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";
import Authorization, {
  ClientId,
} from "../../custom-command/common/authorization";

const institutionHelperActions = new InstitutionHelperActions();

const USERNAME = institutionHelperActions.getUserNameForApiTest();
const PASSWORD = institutionHelperActions.getUserPasswordForApiTest();
const TOKEN_URL = institutionHelperActions.getApiUrlForKeyCloakToken();

function createOrUpdateInstitutionLocation(
  token: string,
  id: string,
  canadian: boolean,
  create: boolean
) {
  const uniqueId = id;
  let body: object;
  let method: string;
  let url: string;
  let status: number;
  if (create) {
    method = "POST";
    url = institutionHelperActions.getApiForLocationCreationOrUpdate();
    status = 201;
  } else {
    method = "PATCH";
    url = `${institutionHelperActions.getApiForLocationCreationOrUpdate()}/1`;
    status = 200;
  }
  if (canadian) {
    body = {
      locationName: `Auto-${uniqueId}-location`,
      institutionCode: "AUTO",
      addressLine1: `Auto-${uniqueId}-Street`,
      addressLine2: "14235",
      selectedCountry: "Canada",
      country: "Canada",
      city: `Auto-${uniqueId}-City`,
      canadaPostalCode: "A1A2A3",
      primaryContactFirstName: `Auto-${uniqueId}-FirstName`,
      primaryContactLastName: `Auto-${uniqueId}-LastName`,
      primaryContactEmail: `Auto@${uniqueId}.com`,
      primaryContactPhone: "32165496872",
      provinceState: "NS",
      postalCode: "A1A2A3",
    };
  } else {
    body = {
      locationName: `Auto-${uniqueId}-location`,
      institutionCode: "AUTO",
      addressLine1: `Auto-${uniqueId}-Street`,
      addressLine2: "14235",
      selectedCountry: "other",
      country: `Auto-${uniqueId}-Country`,
      city: `Auto-${uniqueId}-City`,
      postalCode: "98654",
      primaryContactFirstName: `Auto-${uniqueId}-FirstName`,
      primaryContactLastName: `Auto-${uniqueId}-LastName`,
      primaryContactEmail: `Auto@${uniqueId}.com`,
      primaryContactPhone: "32165496872",
      otherCountry: `testAuto-${uniqueId}-Country`,
      otherPostalCode: "98654",
    };
  }
  cy.request({
    method: method,
    url: url,
    followRedirect: false,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: body,
  }).then((response) => {
    expect(response.status).to.be.equal(status);
  });
}
describe("[Institution Create/Update] Verify location create/update", () => {
  let token: string;
  const uniqueId1 = institutionHelperActions.getUniqueId();
  const uniqueId2 = institutionHelperActions.getUniqueId();
  const uniqueId3 = institutionHelperActions.getUniqueId();
  const uniqueId4 = institutionHelperActions.getUniqueId();

  before(async () => {
    const authorizer = new Authorization();
    token = await authorizer.getAuthToken(
      USERNAME,
      PASSWORD,
      ClientId.Institution,
      TOKEN_URL
    );
  });

  it("Verify to create new Non-Canadian location", () => {
    createOrUpdateInstitutionLocation(token, uniqueId1, false, true);
  });

  it("Verify to create new Canadian location", () => {
    createOrUpdateInstitutionLocation(token, uniqueId2, true, true);
  });

  it("Verify to update the existing location to Canadian Location", () => {
    createOrUpdateInstitutionLocation(token, uniqueId3, true, true);
  });

  it("[Institution Create/Update] - Verify to update the existing location to Non-Canadian Location", () => {
    createOrUpdateInstitutionLocation(token, uniqueId4, false, true);
  });
});
