# BCeID Web Service Integration

## Table of Content

- [BCeID Web Service Integration](#bceid-web-service-integration)
  - [Table of Content](#table-of-content)
  - [Motivation](#motivation)
  - [How Retrieve BCeID Account Details From BCeID Web Service](#how-retrieve-bceid-account-details-from-bceid-web-service)
    - [Request](#request)
    - [Response](#response)
  - [How Retrieve BCeID Account Details From SIMS-API](#how-retrieve-bceid-account-details-from-sims-api)
  - [How Search BCeID Accounts Under a Business BCeID from BCeID Web Service](#how-search-bceid-accounts-under-a-business-bceid-from-bceid-web-service)
    - [Request](#request-1)
    - [Response](#response-1)
  - [How Search BCeID Accounts Under a Business BCeID from SIMS-API](#how-search-bceid-accounts-under-a-business-bceid-from-sims-api)

## Motivation

BCeID is used to authenticate institution users that need to interact in some way with the Student Aid Portal. The current BCeID integration with Keycloak does not provide all the data that the application needs. As described on the below link, only a few properties are available.

https://github.com/bcgov/ocp-sso/wiki/3.2-Identity-Provider-Attribute-Mapping

To retrieve the additional information (e.g. Institution Legal Name) we need to request this data to [IDIM Web Services](https://images.zenhubusercontent.com/5fcebe3c076e6aaed83693fb/8fe2b927-6ce2-4278-aa11-4f8572c17877) using the BCeID Web Service. On the [IDIM Web Services](https://images.zenhubusercontent.com/5fcebe3c076e6aaed83693fb/8fe2b927-6ce2-4278-aa11-4f8572c17877) link we can find the documentation to the BCeID Client Web Services, currently name as "BCeID Client - New Web Services - Developers Guide".
## How Retrieve BCeID Account Details From BCeID Web Service

To retrieve the additional information we are going to use the method *getAccountDetail* available on the BCeID Web Service. Please find below the sample SOAP to request account information (*below values are not real values*).

### Request

````xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v10="http://www.bceid.ca/webservices/Client/V10/">
   <soapenv:Header/>
   <soapenv:Body>
      <v10:getAccountDetail>
         <v10:accountDetailRequest>
            <!-- IDIM Service Account -->
            <v10:onlineServiceId>9191-9999-9999-9A9A</v10:onlineServiceId>
            <!-- Internal = IDIR -->
            <v10:requesterAccountTypeCode>Internal</v10:requesterAccountTypeCode>
            <!-- IDIR Service Account -->
            <v10:requesterUserGuid>c620a9fb-0ff4-46b6-9fb1-c522ddd
            5e46a</v10:requesterUserGuid>
            <!-- BCeID User Name -->
            <v10:userId>BCeID_User_Name</v10:userId>
            <!-- Consider only Business BCeIDs -->
            <v10:accountTypeCode>Business</v10:accountTypeCode>
         </v10:accountDetailRequest>
      </v10:getAccountDetail>
   </soapenv:Body>
</soapenv:Envelope>
````

Please find below a sample SOAP response from the above call.
The response was reduced to better readability.

### Response

````xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
   <soap:Body>
      <getAccountDetailResponse xmlns="http://www.bceid.ca/webservices/Client/V10/">
         <getAccountDetailResult>
            <code>Success</code>
            <failureCode>Void</failureCode>
            <message/>
            <account>
               <guid isAllowed="true">
                  <value>9999A99999BZ4884842Z999Z39Z99ZZZ</value>
               </guid>
               <dluid isAllowed="true">
                  <value>AA9A9A</value>
               </dluid>
               <bceidDluid isAllowed="true">
                  <value>QQ2M8EGGGZ7J</value>
               </bceidDluid>
               <displayName isAllowed="true">
                  <value>Some Name</value>
               </displayName>
               <type isAllowed="true">
                  <name/>
                  <description/>
                  <code>Business</code>
               </type>
               <contact>
                  <email isAllowed="true">
                     <value>do_not_reply_aest@gov.bc.ca</value>
                  </email>
               </contact>
               <individualIdentity>
                  <name>
                     <firstname isAllowed="true">
                        <value>Some First Name</value>
                     </firstname>
                     <middleName isAllowed="false">
                        <value/>
                     </middleName>
                     <otherMiddleName isAllowed="false">
                        <value/>
                     </otherMiddleName>
                     <surname isAllowed="true">
                        <value>Some Last Name</value>
                     </surname>
                     <initials isAllowed="false">
                        <value/>
                     </initials>
                  </name>
               </individualIdentity>
               <business>
                  <guid isAllowed="true">
                     <value>99998F10542349AC8574AE7184B0FAA9</value>
                  </guid>
                  <dluid isAllowed="true">
                     <value>AAAA9A</value>
                  </dluid>
                  <legalName isAllowed="true">
                     <value>College Legal Name</value>
                  </legalName>
               </business>
            </account>
         </getAccountDetailResult>
      </getAccountDetailResponse>
   </soap:Body>
</soap:Envelope>
````


## How Retrieve BCeID Account Details From SIMS-API

An API endpoint was created on our SIMS-API to allow that an authenticated BCeID user could have access to the additional data available on BCeID Web Service.

So, in order to allow our system to have access to the additional BCeID Web Service information, once the endpoint *api/users/bceid-account* is accessed, with a valid BCeID user token, the below information will be returned (*below values are not real values*).

````json
{
    "user": {
        "guid": "9999A99999BZ4884842Z999Z39Z99ZZZ",
        "displayName": "Some Name",
        "firstname": "Some First Name",
        "surname": "Some Last Name",
        "email": "do_not_reply_aest@gov.bc.ca"
    },
    "institution": {
        "guid": "99998F10542349AC8574AE7184B0FAA9",
        "legalName": "College Legal Name"
    }
}
````

## How Search BCeID Accounts Under a Business BCeID from BCeID Web Service

The current requirement is to retrieve all the accounts under a particular institution. To do it we use the method *searchBCeIDAccount* available on the BCeID Web Service. Please find below the sample SOAP to request account information (*below values are not real values*).

### Request

````xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v10="http://www.bceid.ca/webservices/Client/V10/">
   <soapenv:Header/>
   <soapenv:Body>
      <v10:searchBCeIDAccount>
         <v10:bceidAccountSearchRequest>
            <v10:onlineServiceId>9191-9999-9999-9A9A</v10:onlineServiceId>
            <v10:requesterAccountTypeCode>Business</v10:requesterAccountTypeCode>
            <v10:requesterUserGuid>9999A99999BZ4884842Z999Z39Z99ZZZ</v10:requesterUserGuid>
            <v10:pagination>
               <v10:pageSizeMaximum>500</v10:pageSizeMaximum>
               <v10:pageIndex>1</v10:pageIndex>
            </v10:pagination>
            <v10:sort>
               <v10:direction>Ascending</v10:direction>
               <v10:onProperty>Firstname</v10:onProperty>
            </v10:sort>
            <v10:accountMatch>
               <v10:searchableAccountType>Business</v10:searchableAccountType>
            </v10:accountMatch>
            <v10:businessMatch>
               <v10:businessGuid>99998F10542349AC8574AE7184B0FAA9</v10:businessGuid>
            </v10:businessMatch>
         </v10:bceidAccountSearchRequest>
      </v10:searchBCeIDAccount>
   </soapenv:Body>
</soapenv:Envelope>
````

Please find below a sample SOAP response from the above call.
The response was reduced to better readability.

### Response

````xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
   <soap:Body>
      <searchBCeIDAccountResponse xmlns="http://www.bceid.ca/webservices/Client/V10/">
         <searchBCeIDAccountResult>
            <code>Success</code>
            <failureCode>Void</failureCode>
            <message/>
            <pagination>
               <totalItems>31</totalItems>
               <totalVirtualItems>31</totalVirtualItems>
               <requestedPageSize>500</requestedPageSize>
               <requestedPageIndex>1</requestedPageIndex>
            </pagination>
            <accountList>
               <BCeIDAccount>
                  <guid isAllowed="true">
                     <value>9999A99999BZ4884842Z999Z39Z99ZZZ</value>
                  </guid>                 
                  <dluid isAllowed="true">
                     <value>AA9A9A</value>
                  </dluid>
                  <bceidDluid isAllowed="true">
                     <value>AA9A8AAAAA9A</value>
                  </bceidDluid>
                  <userId isAllowed="true">
                     <value>SomeUserId</value>
                  </userId>
                  <state>
                     <isSuspended isAllowed="true">
                        <value>false</value>
                     </isSuspended>
                     <isManagerDisabled isAllowed="true">
                        <value>false</value>
                     </isManagerDisabled>
                  </state>
                  <contact>
                     <email isAllowed="true">
                        <value>do_not_reply@aest.bc.gov</value>
                     </email>
                     <telephone isAllowed="true">
                        <value>025 123456 1234</value>
                     </telephone>
                  </contact>
                  <individualIdentity>
                     <name>
                        <firstname isAllowed="true">
                           <value>John</value>
                        </firstname>
                        <surname isAllowed="true">
                           <value>Doe</value>
                        </surname>
                     </name>
                  </individualIdentity>
                  <business>
                     <guid isAllowed="true">
                        <value>99998F10542349AC8574AE7184B0FAA9</value>
                     </guid>
                     <dluid isAllowed="true">
                        <value>AAAA9A</value>
                     </dluid>
                     <legalName isAllowed="true">
                        <value>College F</value>
                     </legalName>
                     <state>
                        <isSuspended isAllowed="true">
                           <value>false</value>
                        </isSuspended>
                     </state>
                  </business>              
               </BCeIDAccount>
            </accountList>
         </searchBCeIDAccountResult>
      </searchBCeIDAccountResponse>
   </soap:Body>
</soap:Envelope>
````

## How Search BCeID Accounts Under a Business BCeID from SIMS-API

An API endpoint was created on our SIMS-API to allow that an authenticated business BCeID user could have access to all others accounts under the same Business BCeID account. Tthe user requesting such information will only have access to BCeID accounts that he is allowed to access, what is enforced by *requesterUserGuid* parameter on SOAP request.

So, in order to allow our system to search the other BCeID accounts under the same business account, the endpoint *api/users/bceid-accounts* was created and once it is acessed, with a valid business BCeID user token, the below information will be returned (*below values are not real values*).

````json
{
  "accounts": [
    {
      "guid": "9861A92082AA4884842A304A39A63ACA",
      "displayName": "John Doe",
      "firstname": "John",
      "surname": "Doe",
      "email": "johndoe@aest.bc.gov",
      "telephone": "778 912 1234"
    },
    {
      "guid": "1BBB7B28BB994B9B83778BB71B338B2B",
      "displayName": "Jane Doe",
      "firstname": "Jane",
      "surname": "Doe",
      "email": "janedoe@aest.bc.gov",
      "telephone": "778 912 5678"
    }
  ]
}
````
