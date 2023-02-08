import { Provider } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export function createMockedJwtServiceValue(): JwtService {
  return new JwtService({
    secretOrPrivateKey: "Secret key",
  });
}

export function createMockedJwtService(): Provider {
  return {
    provide: JwtService,
    useValue: createMockedJwtServiceValue(),
  };
}
