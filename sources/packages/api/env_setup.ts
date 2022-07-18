import * as path from "path";
import * as dotenv from "dotenv";
if (process.env.NODE_ENV !== ("production" || "docker")) {
  dotenv.config({ path: path.resolve("../../../.env") });
}
