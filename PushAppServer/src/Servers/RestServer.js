const express = require("express");
const app = express();
const https = require("https");
const favicon = require("serve-favicon");

const ResponseToResApiUser = (code = 5, reqID) => {
  console.log("End With Code", code);
  logPath
    ? WriteLog(
        `---------- End RestApi Request id:${reqID}, With Code ${code} ----------`
      )
    : "";

  const ind = RestApiServerDavid.findIndex((x) => x.id === reqID);
  if (ind >= 0) {
    delete TotpAllowRa[reqID];
    delete PrivateKey[reqID];
    delete SignatureMessage[reqID];
    delete locationVar[reqID];
    delete serverUseTimeRa[reqID];
    delete approvalsRa[reqID];
    delete timeOutRa[reqID];
    RestApiServerDavid[ind].res.send({ code: code });
    RestApiServerDavid.splice(ind, 1);
    if (RestApiServerDavid.length === 0) {
      isExternalServer ? davidExternalServerClose() : "";
    }
  } else {
    console.log(`the request was already answered ${reqID}`);
    logPath ? WriteLog(`the request was already answered ${reqID}`) : "";
  }
};

const RestServer = async (port, log, maxNum, password) => {
  isRestServerOn = true;
  app.use(express.json());
  // Add Favicon
  app.use(favicon(__dirname + "/favicon.ico"));

  app.enable("trust proxy");
  global.portNumberInUse = [port];
  isExternalServer ? portNumberInUse.push(isExternalServer) : "";

  console.log(portNumberInUse);
  global.serverNumArray = [];
  for (let i = 0; i < maxNum; i++) {
    serverNumArray.push(i);
  }

  // The Route To Start The Temp Server That begins the MFA Process
  app.post("/", async (req, res) => {
    if (RestApiServerDavid.length === 0) {
      console.log(log, "log");
      isExternalServer ? ExternalServer(log) : "";
    }
    const data = req.body;
    // console.log(req.body, req.params, req.query, req.url);
    const reqID =
      Math.floor(Math.random() * 10000) +
      Math.random().toString(36).slice(3, 6) +
      Date.now();
    if (data.passWord == password) {
      if (!portNumberInUse.includes(data.port)) {
        portNumberInUse.push(data.port);
        RestApiServerDavid.push({ res: res, id: reqID });
        testServer(true, log, reqID, serverNumArray.pop(), data);
      } else {
        res.send({ code: 11 });
      }
    } else {
      logPath ? WriteLog(`Wrong PassWord Request from ${req.ip}`) : "";
      res.send({ code: 10 });
    }
  });

  // Start Rest Server
  app.listen(port, () => {
    logPath ? WriteLog(`Server started on Port: ${port}`) : "";
    log ? console.log(`Server started on Port: ${port}`) : "";
  });
};

module.exports = { ResponseToResApiUser, RestServer };
const { testServer } = require("./testserver");
const { ExternalServer } = require("./ExternalServer");
