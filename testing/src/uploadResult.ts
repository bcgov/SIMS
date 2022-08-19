import axios, { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";

const TQ_USERNAME = process.env.TQ_USER_NAME;
const TQ_PASSWORD = process.env.TQ_PASSWORD;
const TQ_SECRET = process.env.TQ_SECRET;
const TQ_RUN_ID = process.env.TQ_RUN_ID; //( default id is 26606. Will need to change once we have integrated TQ account for the team)

const getAuthToken = async (): Promise<AxiosResponse<any>> => {
  const url = "https://api.testquality.com/api/oauth/access_token";
  const body = JSON.stringify({
    grant_type: "password",
    client_id: "2",
    client_secret: TQ_SECRET,
    username: TQ_USERNAME,
    password: TQ_PASSWORD,
  });
  const settings = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    console.log("Fetching the token from TestQuality");
    const response = await axios.post(url, body, settings);
    console.log("Token Fetched");
    return response.data["access_token"];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function uploadResultFile() {
  const auth = await getAuthToken();
  const url = `https://api.testquality.com/api/plan/${TQ_RUN_ID}/junit_xml`;
  var formData = new FormData();
  var resultFile = fs.createReadStream("test-results.xml");
  formData.append("file", resultFile, "test-results.xml");
  try {
    if (String(auth).length > 1) {
      const settings = {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${auth}`,
        },
      };
      const response = await axios.post(url, formData, settings);
      console.log("Successfully uploaded the test results file to TestQuality");
      return true;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

uploadResultFile();
