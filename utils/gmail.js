const dotenv = require("dotenv");
dotenv.config();
const { google } = require("googleapis");
const { fetchFileContent, saveFileContent } = require("./fileAction");
const { createLabels } = require("../handlers/labels");

const { client_id, client_secret, redirect_uri, SCOPES } = process.env;

const Scopes = JSON.parse(SCOPES);

const auth = async (req, res) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: Scopes,
    });
    // res.redirect(authUrl);
    return res.status(200).send(authUrl);
  } catch (error) {
    console.log("error while authenticating gmail", error);
    return res.status(500).json({ error: error.message });
  }
};

const authCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );

    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);

    const fileContent = fetchFileContent();

    let parsedFileContent = {};
    if (fileContent) {
      parsedFileContent = JSON.parse(fileContent);
    }

    // Get user profile information
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get();

    const oldData = parsedFileContent[data.email] || {};

    const updatedFileContent = {
      ...parsedFileContent,
      [data.email]: {
        ...oldData,
        ["tokens"]: tokens,
      },
    };

    saveFileContent(JSON.stringify(updatedFileContent));
    await createLabels(oAuth2Client, updatedFileContent, data.email);

    // res
    //   .status(200)
    //   .json({ message: "Authentication successful", email: data.email });

    return res.redirect(
      `/information?email=${data.email}&calendlyLink=${oldData.calendlyLink}&isWatching=${oldData.isWatching}`
    );
  } catch (error) {
    console.log("error while authenticating gmail", error);
    return res.status(500).json({ error: error.message });
  }
};

const getAuthenticatedGmail = async (email) => {
  try {
    const fileContent = fetchFileContent();

    const parsedFileContent = JSON.parse(fileContent);

    const useDetails = parsedFileContent[email];

    if (!useDetails || !useDetails.tokens) {
      throw new Error("No tokens found for the user");
    }

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );

    oAuth2Client.setCredentials(useDetails.tokens);

    if (oAuth2Client.isTokenExpiring()) {
      try {
        const response = await oAuth2Client.refreshAccessToken();

        oAuth2Client.setCredentials(response.credentials);

        const updatedFileContent = {
          ...parsedFileContent,
          [email]: {
            ...useDetails,
            ["tokens"]: response.credentials,
          },
        };

        saveFileContent(JSON.stringify(updatedFileContent));
      } catch (refreshError) {
        console.log("error while refreshing token", refreshError);

        //notify user to authenticate again
        throw refreshError;
      }
    }

    return google.gmail({ version: "v1", auth: oAuth2Client });
  } catch (error) {
    console.log("error while getting authenticated gmail", error);
    throw error;
  }
};

module.exports = {
  auth,
  authCallback,
  getAuthenticatedGmail,
};