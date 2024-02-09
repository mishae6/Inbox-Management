const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

const { auth, authCallback } = require("./utils/gmail");
const { isLoggedIn } = require("./utils/shared");
const { startWatch, stopWatch } = require("./handlers/watch");
const { createLabels, getLabels } = require("./handlers/labels");
const { notification } = require("./handlers/notification");

const cronJob = require("./utils/cronJob");
const { addCalendly } = require("./handlers/addCalendly");
const { renderForm } = require("./handlers/renderForm");

const app = express();
app.use(bodyParser.json());

// set the view engine to ejs
app.set("view engine", "ejs");

cronJob();

app.get("/", (req, res) => {
  res.render("pages/index");
});

app.post("/auth", auth);
app.get("/auth/callback", authCallback);

app.get("/information", renderForm);

app.get("/watch", isLoggedIn, startWatch);
app.get("/stopwatch", isLoggedIn, stopWatch);
app.post("/calendly", isLoggedIn, addCalendly);

// app.get("/create-label", isLoggedIn, createLabels);
app.get("/labels", isLoggedIn, getLabels);

app.post("/notification", notification);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
