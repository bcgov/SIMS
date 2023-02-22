import * as dotenv from "dotenv";
import * as findConfig from "find-config";

/**
 * Node environments where the .env should not be used.
 */
const ignoreEnvs = ["production", "docker"];
/**
 * Locate the .env file recursively and load its variables.
 * Used to run the applications and the tests locally.
 */
function envConfigLoad() {
  if (!ignoreEnvs.includes(process.env.NODE_ENV)) {
    dotenv.config({ path: findConfig(".env") });
  }
}
envConfigLoad();
