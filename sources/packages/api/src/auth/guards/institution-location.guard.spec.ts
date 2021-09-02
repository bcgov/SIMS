import {
  createFakeHttpContext,
  createFakeReflectorForHasLocationAccess,
} from "../../testHelpers";
import { InstitutionUserAuthorizations } from "../../services/institution-user-auth/institution-user-auth.models";
import { HasLocationAccessParam } from "../decorators";
import { IInstitutionUserToken } from "../userToken.interface";
import { InstitutionLocationGuard } from "./institution-location.guard";
import { InstitutionUserTypes } from "../user-types.enum";

const activateGuard = async (
  locationId: number,
  authorizations: InstitutionUserAuthorizations,
): Promise<boolean> => {
  const locationIdParamName = "locationId";

  const reflector = createFakeReflectorForHasLocationAccess({
    locationIdParamName,
  } as HasLocationAccessParam);

  const guard = new InstitutionLocationGuard(reflector);
  const user = {} as IInstitutionUserToken;
  user.authorizations = authorizations;

  const httpRequest = { user, params: { [locationIdParamName]: locationId } };
  const httpContext = createFakeHttpContext(httpRequest);
  return guard.canActivate(httpContext);
};

describe("InstitutionLocationGuard", () => {
  it("Should return true when locationId is present for a non Institution Admin user", async () => {
    // Arrange
    const locationId = 1;
    const authorizations = [
      {
        locationId,
        userType: null,
        userRole: null,
      },
    ];
    const userAuthorizations = new InstitutionUserAuthorizations(
      0, // Institution Id is not used in this test.
      authorizations,
    );
    // Act
    const result = await activateGuard(locationId, userAuthorizations);
    // Assert
    expect(result).toBe(true);
  });

  it("Should return false when locationId is not present for a non Institution Admin user", async () => {
    // Arrange
    const locationId = 1;
    const authorizations = [
      {
        locationId: 2,
        userType: null,
        userRole: null,
      },
    ];
    const userAuthorizations = new InstitutionUserAuthorizations(
      0, // Institution Id is not used in this test.
      authorizations,
    );
    // Act
    const result = await activateGuard(locationId, userAuthorizations);
    // Assert
    expect(result).toBe(false);
  });

  it("Should return false when authorizations are not loaded", async () => {
    // Arrange
    const locationId = 1;
    const userAuthorizations = new InstitutionUserAuthorizations();
    // Act
    const result = await activateGuard(locationId, userAuthorizations);
    // Assert
    expect(result).toBe(false);
  });

  it("Should return true to an Institution Admin user when the location id belongs to his Institution", async () => {
    // Arrange
    const locationId = 1;
    const userAuthorizations = new InstitutionUserAuthorizations(0, [
      {
        locationId: null,
        userType: InstitutionUserTypes.admin,
        userRole: null,
      },
    ]);
    userAuthorizations.adminLocationsIds = [1];
    // Act
    const result = await activateGuard(locationId, userAuthorizations);
    // Assert
    expect(result).toBe(true);
  });

  it("Should return false to an Institution Admin user when the location id does not belong to his Institution", async () => {
    // Arrange
    const locationId = 1;
    const userAuthorizations = new InstitutionUserAuthorizations(0, [
      {
        locationId: null,
        userType: InstitutionUserTypes.admin,
        userRole: null,
      },
    ]);
    userAuthorizations.adminLocationsIds = [2];
    // Act
    const result = await activateGuard(locationId, userAuthorizations);
    // Assert
    expect(result).toBe(false);
  });
});
