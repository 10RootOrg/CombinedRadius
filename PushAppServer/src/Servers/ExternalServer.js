const express = require("express");
const app = express();
const https = require("https");
const VerifyRoute = require("../Routes/VerifyRoute");
const favicon = require("serve-favicon");
const ip = require("ip");
const { error } = require("console");

const ExternalServer = async (log) => {
  app.use(express.json());
  app.enable("trust proxy");
  // Add Favicon
  app.use(favicon(__dirname + "/favicon.ico"));
  app.get("/Verify/accept/:token/:tmpPort/:totp", async (req, res) => {
    try {
      const tempResponse = await fetch(
        `http://${ip.address()}:${req.params.tmpPort}/Verify/accept/${
          req.params.token
        }/${req.params.totp}`,
        { method: "GET" }
      );
      const tempResponseJson = await tempResponse.text();
      res.send(tempResponseJson);
    } catch (err) {
      res.status(404).send("server already closed");
    }
  });

  app.get("/Verify/reject/:token/:tmpPort", async (req, res) => {
    try {
      const tempResponse = await fetch(
        `http://${ip.address()}:${req.params.tmpPort}/Verify/reject/${
          req.params.token
        }`,
        { method: "GET" }
      );
      const tempResponseJson = await tempResponse.text();
      res.send(tempResponseJson);
    } catch (err) {
      res.status(404).send("server already closed");
    }
  });

  app.get("/Verify/noVerify/:token/:tmpPort", async (req, res) => {
    try {
      const tempResponse = await fetch(
        `http://${ip.address()}:${req.params.tmpPort}/Verify/noVerify/${
          req.params.token
        }`,
        { method: "GET" }
      );
      const tempResponseJson = await tempResponse.text();
      res.send(tempResponseJson);
    } catch (err) {
      res.status(404).send("server already closed");
    }
  });

  app.get("/Verify/wrongLocation/:token/:tmpPort", async (req, res) => {
    try {
      const tempResponse = await fetch(
        `http://${ip.address()}:${req.params.tmpPort}/Verify/wrongLocation/${
          req.params.token
        }`,
        { method: "GET" }
      );
      const tempResponseJson = await tempResponse.text();
      res.send(tempResponseJson);
    } catch (err) {
      res.status(404).send("server already closed");
    }
  });

  //   app.listen(isExternalServer, () => {
  //     log
  //       ? console.log(
  //           `External Access Server started on Port: ${isExternalServer}`
  //         )
  //       : "";
  //   });

  const server = await app.listen(isExternalServer, () => {
    logPath
      ? WriteLog(`External Access Server started on Port: ${isExternalServer}`)
      : "";

    log
      ? console.log(
          `External Access Server started on Port: ${isExternalServer}`
        )
      : "";
  });

  global.davidExternalServerClose = (code) => {
    // console.log(code, reqID, num);
    server.close(() => {
      logPath
        ? WriteLog(
            `No More Active Requests, Therefor the External Server on Port: ${isExternalServer} is Closed`
          )
        : "";

      log
        ? console.log(
            `No More Active Requests, Therefor the External Server on Port: ${isExternalServer} is Closed`
          )
        : "";
    });
  };
};

module.exports = { ExternalServer };
