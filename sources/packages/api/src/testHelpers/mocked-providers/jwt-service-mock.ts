import { Provider } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export function createMockedJwtService(): Provider {
  const jwtService = new JwtService({
    secretOrPrivateKey: "Secret key",
  });
  return {
    provide: JwtService,
    useValue: jwtService,
  };
}
