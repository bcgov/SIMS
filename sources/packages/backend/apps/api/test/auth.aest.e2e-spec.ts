import { JwtService } from "@nestjs/jwt";
import { Role } from "../src/auth";
import { AESTGroups, getAESTToken } from "../src/testHelpers";

const jwtService = new JwtService();

describe("Auth Ministry", () => {
  it("Should have specific roles when ministry user is a business administrator.", async () => {
    //Act
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    //Assert
    const decodedToken = jwtService.decode(token);
    expect(
      decodedToken["resource_access"].aest.roles.sort((a, b) =>
        a.localeCompare(b),
      ),
    ).toEqual(Object.values(Role).sort((a, b) => a.localeCompare(b)));
  });
});
