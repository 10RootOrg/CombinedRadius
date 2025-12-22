const express = require("express");
const { phase2 } = require("../Controller/VerifyController");
const {
  tokenReceiver,
  totpValidate,
} = require("../MiddleWare/VerifyMiddleWare");
const { WriteLog } = require("../Model/Logger");

const router = express.Router();

router.get("/accept/:token/:totp", tokenReceiver, totpValidate, phase2);

router.get("/reject/:token", tokenReceiver, (req, res) => {
  res.send(
    "<html> <body><h1> Hello And Welcome To Response Page</h1> <br> <h2> You Rejected Access </h2></body></html>"
  );
  console.log(req.body.contact + " Denied");
  logPath ? WriteLog(`${req.body.contact} Denied`) : "";

  setTimeout(() => {
    isRestServerOn ?clearTimeout(timeOutRa[req.port]):"";

    isRestServerOn ? req.davidServerClose(1) : process.exit(1);
  }, 1500);
});

router.get("/noVerify/:token", tokenReceiver, (req, res) => {
  res.send({ ok: true });
  console.log(req.body.contact + " Not Verified ");
  logPath ? WriteLog(`${req.body.contact} Not Verified`) : "";

  setTimeout(() => {
    isRestServerOn ?clearTimeout(timeOutRa[req.port]):"";

    isRestServerOn ? req.davidServerClose(3) : process.exit(3);
  }, 1500);
});

router.get("/wrongLocation/:token", tokenReceiver, (req, res) => {
  res.send({ ok: true });
  console.log(req.body.contact + " not in client list of allowed locations ");
  logPath
    ? WriteLog(`${req.body.contact} not in client list of allowed locations `)
    : "";

  setTimeout(() => {
    isRestServerOn ?clearTimeout(timeOutRa[req.port]):"";

    isRestServerOn ? req.davidServerClose(9) : process.exit(9);
  }, 1500);
});

module.exports = router;
