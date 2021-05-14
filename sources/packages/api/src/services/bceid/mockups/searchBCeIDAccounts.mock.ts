// This is a sample response used for development purposes only
// to allow to simulate the response from BCeID Web Service
// processed by the service BCeIDService(bceid.service.ts).
// This data will be returned when the below env variable is set
// DUMMY_BCeID_ACCOUNT_RESPONSE === "yes"
// For a complete response from the BCeID Test Web Service please
// copy the file available on "Teams>Files>BCeID Web Service Mockups"
export const mock = {
  accounts: [
    {
      guid: "4861E92082BD4884842F304C39F63FCB",
      userId: "JohnDoe456",
      displayName: "John Doe",
      firstname: "John",
      surname: "Doe",
      email: "johndoe@aest.bc.gov",
      telephone: "778 912 1234",
    },
    {
      guid: "1BFF7C28BD994B9D83778FB71A33862E",
      userId: "JaneDoe456",
      displayName: "Jane Doe",
      firstname: "Jane",
      surname: "Doe",
      email: "janedoe@aest.bc.gov",
      telephone: "778 912 5678",
    },
  ],
  paginationResult: {
    totalItems: 2,
    requestedPageSize: 500,
    requestedPageIndex: 1,
  },
};
