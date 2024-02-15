// import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import axios from "axios";
import FormData from "form-data";
import bodyParser from "body-parser";
import GridMail from "./sgrid.js";
// import { setGlobalOptions } from "firebase-functions/v2";
// setGlobalOptions({ maxInstances: 10 });

const app = express();
app.use(bodyParser.json());

const MCT_ENDPT = "undp.biji-biji.com";
const MCT_CLIENT_ID = "f16cdc2f-c1a6-417f-992b-4370e81775e8";
const MCT_CLIENT_SECRET = "uha8Q~dYUmownYMOuYBEMlgsE.rrQTZXFN3zkddk";
const MCT_API_URI = "api://bf8331fd-17ed-4bcf-af5f-599db14ff4f4";
const MCT_TENANT_ID = "b1aab053-6242-46ec-9cf8-bd02e63dd2da";
const HS_KEY = "pat-na1-967cc036-c56e-407f-b84b-4d434f710e7d";
const SGRID_API_KEY =
  "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";
const SGRID_FROM_EMAIL = "team@skillourfuture.org";
const SGRID_TEMPLATE_ID = "d-54113e54930f49a59d0c898cb2cf7cd7";

GridMail.setApiKey(SGRID_API_KEY);
const grid_mailer = new GridMail()
  .setTemplate(SGRID_TEMPLATE_ID)
  .setFrom(SGRID_FROM_EMAIL);

app.get("/getApi", async (req, res) => {
  const contactId = 78;
  const akey = await getApiKey();
  const data = await getUserCertificate(contactId, akey)
  console.log(data, "data")
  res.send({ message: data });
})
let completedCourses = [];

app.post("/api/generate-certificate", async (req, res) => {
  const contactId = 78;

  // Get SendGrid API key
  const akey = await getApiKey();

  // Get the certificate details
  const userReport = await getUserCertificate(contactId, akey)
  
  let email = userReport.EmailOfUser;

  for (const module of userReport.ModuleDetails) {
    if (module.CompletedOn !== 'NOT APPLICABLE' && !completedCourses.includes(module.ModuleId)) {
       completedCourses.push(module.ModuleId);
    }
 }
 
 // Send email after processing all completed courses
 if (completedCourses.length > 0) {
    console.log("Sending gridmail...");
    try {
       // Send grid mail
       let mailer = await grid_mailer
          .setTemplateData({
             username: "amishsingh8561@gmail.com",
             password: "default_password",
             nickname: "nickname",
          })
          .setTo(email)
          .send();
       console.log(JSON.parse(JSON.stringify(mailer)));
    } catch (e) {
       console.log("WARNING: Failed to send email. Error details:", e);
 
       // Log the specific error details if available
       if (e.response && e.response.body && e.response.body.errors) {
          console.log("Error details:", e.response.body.errors);
       }
 
       return res.status(500).json({ message: "Failed to send email" });
    }
 }




  return res.status(200).json({ message: "success" });



});



const getUserCertificate = async (contactId, akey) => {
  const url = `https://undp.biji-biji.com/api/v1/Analytics/Learner/${contactId}/ReportCard`;
  const config = {
    headers: {
      Authorization: `Bearer ${akey}`,
      clientType: "service",
    },
  };
  try {
    const response = await axios.get(url, config);
    const data = response.data;


    return data;
  } catch (error) {
    console.error("Error in request:", error);
    throw error;
  }
};
const getApiKey = async () => {
  const tokenEndpoint = `https://login.microsoft.com/${MCT_TENANT_ID}/oauth2/v2.0/token`;
  const data = `grant_type=client_credentials&client_id=${encodeURIComponent(
    MCT_CLIENT_ID
  )}&scope=${encodeURIComponent(
    `${MCT_API_URI}/.default`
  )}&client_secret=${encodeURIComponent(MCT_CLIENT_SECRET)}`;

  const config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(data),
    },
  };

  try {
    const response = await axios.post(tokenEndpoint, data, config);
    const tokenData = response.data;

    if (tokenData.access_token) {
      return tokenData.access_token;
    } else {
      throw new Error("Failed to obtain MCT API key.");
    }
  } catch (error) {
    console.error("Error in request:", error);
    throw error;
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// export const createUser = onRequest(app);