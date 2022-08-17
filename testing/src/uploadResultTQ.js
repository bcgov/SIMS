var request = require('request');
var fs = require('fs');
import * as dotenv from "dotenv";



token = undefined
const tq_username = process.env.TQ_USER_NAME;
const tq_password = process.env.TQ_PASSWORD;
const tq_secret = process.env.TQ_SECRET;
var options = {
  'method': 'POST',
  'url': 'https://api.testquality.com/api/oauth/access_token',
  'headers': {
        'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "grant_type": "password",
    "client_id": "2",
    "client_secret": `"${TQ_SECRET}"`,
    "username": `"${TQ_USER_NAME}"`,
    "password": `"${TQ_PASSWORD}"`
  })
};
function loginToTQ (callback){
    request(options, function (error, response) {
        if (error) throw new Error(error);
        const obj =  JSON.parse(response.body)
        token = obj["access_token"]
        // console.log("Fetching the TQ Token")
        callback()
         });
}

function uploadXmlRun (){
    var options_upload = {
        'method': 'POST',
        'url': 'https://api.testquality.com/api/plan/26609/junit_xml',
        'headers': {
          'Authorization': `Bearer ${token}`,
        },
        formData: {
          'files[0]': {
            'value': fs.createReadStream('./testing/src/test-results.xml'),
            'options': {
              'filename': 'test-results.xml',
              'contentType': null
            }
          }
        }
      };
      request(options_upload, function (error, response) {
        if (error) throw new Error(error);
        console.log("The file has been uploaded")
      });
}

loginToTQ(uploadXmlRun)