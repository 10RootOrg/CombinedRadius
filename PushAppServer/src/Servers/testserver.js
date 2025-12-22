const express = require("express");
const https = require("https");
const { ResponseToResApiUser } = require("./RestServer");
const favicon = require("serve-favicon");

const VerifyRoute = require("../Routes/VerifyRoute");
const { readKeyPrivate } = require("../Model/VerifyModel");
const { RestApiRunModel } = require("../Model/RestApiRunModel");
const path = require("path");
const app = [];
const server = [];

const testServer = async (port, log, reqID, num, data) => {
  app[num] = express();

  app[num].use(express.json());
  app[num].enable("trust proxy");
  app[num].use((req, res, next) => {
    const davidServerClose = (code) => {
      // console.log(code, reqID, num);
      server[num].close(() => {
        ResponseToResApiUser(code, reqID);
        const ind = portNumberInUse.findIndex((x) => x === data.port);
        if (ind >= 0) {
          portNumberInUse.splice(ind, 1);
        }
        serverNumArray.push(num);
        logPath ? WriteLog(`Session Server Is closed`) : "";
        console.log("Session Server Is closed");
      });
    };

    
    req.port = data.port;
    req.davidServerClose = davidServerClose;

    next();
  });
  app[num].use("/Verify", VerifyRoute);
  // Add Favicon
  app[num].use(favicon(__dirname + "/favicon.ico"));

  app[num].get("/yyy/:code", async (req, res) => {
    res.send(true);
    console.log("yyyyyyy");
    req.davidServerClose(req.params.code);
  });

  TotpAllowRa[data.port] = data.allowTotp;
  data.privatekey
    ? (PrivateKey[data.port] = await readKeyPrivate(data.privatekey).toString())
    : "";
  data.privatekey
    ? (SignatureMessage[data.port] = path.basename(
        data.privatekey,
        "-privateKey.pem"
      ))
    : "";
  const filterContact = (entry) => {
    return entry !== "";
  };

  locationVar[data.port] = {
    longitude: data.location ? data.location.longitude : undefined,
    latitude: data.location ? data.location.latitude : undefined,
  };
  data.Email = data?.Email?.filter(filterContact);
  data.PhoneID = data?.PhoneID?.filter(filterContact);

  serverUseTimeRa[data.port] = [
    ...(data.Email ? data.Email : ""),
    ...(data.PhoneID ? data.PhoneID : ""),
  ];
  approvalsRa[data.port] = data.minApproval;
  const davidServerClose = (code) => {
    // console.log(code, reqID, num);
    server[num].close(() => {
      ResponseToResApiUser(code, reqID);
      const ind = portNumberInUse.findIndex((x) => x === data.port);
      if (ind >= 0) {
        portNumberInUse.splice(ind, 1);
      }
      serverNumArray.push(num);
      logPath ? WriteLog(`Session Server Is closed`) : "";
      console.log("Session Server Is closed");
    });
  };
  RestApiRunModel(data, davidServerClose);

  server[num] = await app[num].listen(data.port, () => {
    logPath ? WriteLog(`Session Server started on Port: ${data.port}`) : "";

    log ? console.log(`Session Server started on Port: ${data.port}`) : "";
  });

  timeOutRa[data.port] = setTimeout(() => {
    console.log("Time Run Out Server Is Closing");
    davidServerClose(2);
  }, (data.TTL + 20) * 1000);
};

module.exports = { testServer };
