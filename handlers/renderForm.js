const { fetchFileContent } = require("../utils/fileAction");

const renderForm = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.redirect("/");
  }

  const fileContent = fetchFileContent();

  if (!fileContent) {
    return res.redirect("/");
  }

  const parsedFileContent = JSON.parse(fileContent);
  const userDetail = parsedFileContent[email];

  if (!userDetail) {
    return res.redirect("/");
  }

  const { calendlyLink, isWatching } = userDetail;

  res.render("pages/information", {
    email,
    calendlyLink,
    isWatching,
  });
};

module.exports = {
  renderForm,
};
