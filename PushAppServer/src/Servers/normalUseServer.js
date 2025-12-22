const express = require("express");
const app = express();
const https = require("https");
const VerifyRoute = require("../Routes/VerifyRoute");
const favicon = require("serve-favicon");

const normalServer = async (port, log) => {
  app.use(express.json());
  app.enable("trust proxy");
  app.use("/Verify", VerifyRoute);
  // Add Favicon
  app.use(favicon(__dirname + "/favicon.ico"));

  app.listen(port, () => {
    log ? console.log(`Temp Server started on Port: ${port}`) : "";
  });
};

module.exports = { normalServer };
