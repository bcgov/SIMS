// This is a sample response used for development purposes only
// to allow to simulate the response from BCeID Web Service
// processed by the service BCeIDService(bceid.service.ts).
// This data will be returned when the below env variable is set
// DUMMY_BCeID_ACCOUNT_RESPONSE === "yes"
export default {
  user: {
    guid: "a90b3-ff78c-98b0c-2e5fb-7c667",
    displayName: "Test Account",
    firstname: "Test",
    surname: "Account",
    email: "test.account@sims.ca",
  },
  institution: {
    guid: "b90a3-ee78b-98a0d-2f5db-7a457",
    legalName: "Test Institute",
  },
};
