describe("Institution api", () => {
  const access_token =
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJWZGp4Nlp0X0ZUbHcwbmhHMVFyVi0yeWI2cmI1M1R6Um5Ib0ZkV2cwWXAwIn0.eyJleHAiOjE2NTM0MTE5NTAsImlhdCI6MTY1MzQxMTY1MCwiYXV0aF90aW1lIjoxNjUzNDA5MDEyLCJqdGkiOiJmZmZlMGUzZi1iODJkLTRiZjktODhlZi1jODY1MDFlZjI3OWUiLCJpc3MiOiJodHRwczovL2Rldi5vaWRjLmdvdi5iYy5jYS9hdXRoL3JlYWxtcy9qeG9lMm80NiIsImF1ZCI6InNpbXMtYXBpIiwic3ViIjoiYThiYzc0ZDMtNDM5MC00YjkwLWFiYjgtYjhhZDFjMTRlOGMyIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiaW5zdGl0dXRpb24iLCJub25jZSI6IjQxN2MzMmJiLWJiYzItNDFmOC05OTZiLTZkNzdkNDJkOTE2YSIsInNlc3Npb25fc3RhdGUiOiJlN2I1Mzg2Ny0xZGZmLTQ3OGUtODcxZS0yYjliMjMyOTJhZTMiLCJhY3IiOiIwIiwicmVzb3VyY2VfYWNjZXNzIjp7Imluc3RpdHV0aW9uIjp7InJvbGVzIjpbIkluc3RpdHV0aW9uQWRtaW4iXX19LCJzY29wZSI6Im9wZW5pZCBJRFAgZGVmYXVsdC1uYW1lLXNjb3BlIHNpbXMtYXBpLWF1ZGllbmNlLXNjb3BlIHVzZXJuYW1lIiwibGFzdE5hbWUiOiJOb3RBdmFpbGFibGUiLCJJRFAiOiJCQ0VJRCIsImdpdmVuTmFtZXMiOiJDT0xMQyIsInVzZXJOYW1lIjoiYjIyNWNiNzZjZmQ2NDg2ZDg1ZGE5MGVjNWI3NzVmMmRAYmNlaWQiLCJpZHBfdXNlcl9uYW1lIjoic2ltczJfY29sbGMifQ.S534R211j2wv4vET0FaT2MtdTSJjUkr8ZaL5XGFRYO6lQxcXjmJQ7zIC7Yd8lwec2aUyAbuCGPbSNsISoi0bIoZvA11yxNdCMMWPXWKSMDmPsKvOCHXSvfejTiGdj18mrJs8mDaNgfK_uxfuvIv7GtgilFPm5bHg5BmzvVBW94EV-oiR-4n9IWORn1DZSyORbN1jqJUMh6cgisMB8a2ry5-L_hcudTYJElXXYjbIzMmaAPvqJTtymmO_VnRhc4vaFUG-23fYwdhFPOEnJ_cQY20ENjWlz3sy5fINX27gTevXd7cCkeSk68xAUlGCsauoGq2cR_6gBsNhdPFJkn10Xw";

  it("PATCH - Add location via api call", () => {
    cy.request({
      method: "PATCH",
      url: "/api/institutions/institution",
      auth: {
        bearer: access_token,
      },
      body: {
        primaryContactEmail: "ryan@gov.bc.ca",
        primaryContactFirstName: "Ryan",
        primaryContactLastName: "Gosling",
        primaryContactPhone: "2382973645",
        mailingAddress: {
          addressLine1: "2285 Blind Bay Road",
          addressLine2: "Chesley",
          city: "Mica Creek",
          country: "Canada",
          postalCode: "V0E 2L0",
          provinceState: "British Columbia",
          canadaPostalCode: "N0G 4K9",
          otherPostalCode: "P2R 3M2",
          selectedCountry: "Canada",
          otherCountry: "",
        },
      },
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      expect(response.isOkStatusCode).to.be.true;
      expect(response.status).to.be.equal(200);
    });
  });
});
