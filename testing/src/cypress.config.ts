import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "bebu4p",
  viewportWidth: 1280,
  viewportHeight: 720,
  retries: {
    runMode: 1,
    openMode: 1,
  },
  reporter: "junit",
  screenshotOnRunFailure: true,
  reporterOptions: {
    reporterEnabled: "mochawesome",
    reporterOptions: {
      mochaFile: 'results/test-results.xml',
      toConsole: true
    }
  },
  video: false,
  chromeWebSecurity: false,
  defaultCommandTimeout: 10000,
  numTestsKeptInMemory: 0,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    // baseUrl: "https://dev-aest-sims.apps.silver.devops.gov.bc.ca/",
  }
});
