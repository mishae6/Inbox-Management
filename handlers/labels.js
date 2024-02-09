const { saveFileContent } = require("../utils/fileAction");
const { google } = require("googleapis");

const createLabels = async (oAuth2Client, parsedFileContent, email) => {
  try {
    const authenticatedGmail = google.gmail({
      version: "v1",
      auth: oAuth2Client,
    });

    const labels = ["Positive", "Neutral", "Negative"];

    const usersLabels = await authenticatedGmail.users.labels.list({
      userId: "me",
    });

    const existingLabelsData = usersLabels?.data?.labels;
    const existingLabels = [];
    const nonExistingLabels = [];

    labels.forEach((label) => {
      const existingLabel = existingLabelsData.find(
        (existingLabel) =>
          existingLabel?.name?.toLowerCase() === label.toLowerCase()
      );

      if (existingLabel) {
        existingLabels.push({
          name: existingLabel.name.toLowerCase(),
          id: existingLabel.id,
        });
      } else {
        nonExistingLabels.push(label);
      }
    });

    await Promise.all(
      nonExistingLabels.map(async (label) => {
        const res = await authenticatedGmail.users.labels.create({
          userId: "me",
          resource: {
            name: label,
          },
        });

        existingLabels.push({
          name: res.data.name.toLowerCase(),
          id: res.data.id,
        });
      })
    );

    const labelsObj = existingLabels.reduce((acc, label) => {
      acc[label.name.toLowerCase()] = label.id;
      return acc;
    }, {});

    const userDetail = parsedFileContent[email] || {};
    const updatedFileContent = {
      ...parsedFileContent,
      [email]: {
        ...userDetail,
        labels: labelsObj,
      },
    };

    saveFileContent(JSON.stringify(updatedFileContent));

    return true;
  } catch (error) {
    console.log("error while creating labels", error);
    throw error;
  }
};

const getLabels = async (req, res) => {
  try {
    const authenticatedGmail = req.authenticatedGmail;

    const usersLabels = await authenticatedGmail.users.labels.list({
      userId: "me",
    });

    const labels = usersLabels?.data?.labels;

    return res.status(200).json({ data: labels });
  } catch (error) {
    console.log("error while getting labels", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createLabels,
  getLabels,
};
