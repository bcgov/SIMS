import { JwtService } from "@nestjs/jwt";
import { IUserToken, Role } from "../src/auth";
import { AESTGroups, getAESTToken } from "../src/testHelpers";

const jwtService = new JwtService();

describe("Auth Ministry", () => {
  it("Should have all roles when ministry user is a business administrator.", async () => {
    //Act
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const decodedToken = jwtService.decode(token) as IUserToken;
    decodedToken.resource_access.aest.roles.sort((a, b) => a.localeCompare(b));
    const allAESTRoles = Object.values(Role).sort((a, b) => a.localeCompare(b));

    //Assert
    expect(decodedToken.resource_access.aest.roles).toEqual(allAESTRoles);
  });
});
