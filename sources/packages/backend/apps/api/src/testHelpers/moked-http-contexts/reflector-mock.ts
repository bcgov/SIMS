import { Reflector } from "@nestjs/core";
import { HasLocationAccessParam } from "../../auth/decorators";

export function createFakeReflectorForHasLocationAccess(
  param: Partial<HasLocationAccessParam>,
): Reflector {
  const reflector = new Reflector();
  jest.spyOn(reflector, "getAllAndOverride").mockImplementation(() => {
    return param as HasLocationAccessParam;
  });
  return reflector;
}
