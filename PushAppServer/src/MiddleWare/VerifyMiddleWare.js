const jwt = require("jsonwebtoken");
const base32 = require("hi-base32");
const totp = require("totp-generator");
const { WriteLog } = require("../Model/Logger");
const TOKEN_SECRET = "ankasbhfjlasbhfhkjsabf15125asfsaf11";
// const ipaddrJS = require("ipaddr.js");
const tokenReceiver = (req, res, next) => {
  const token = req.params.token;
  // const reqIP = req.ip.startsWith("::ffff:") ? req.ip.substring(7) : req.ip;
  // console.log(
  //   ipaddrJS.parse(reqIP).range()
  //     ? "The Ip Is Private On The Private Network Therefor Will Use External Ip Of Network"
  //     : "normal ip outside Of Local Network"
  // );
  // const ipURL = `https://geolocation-db.com/json/${
  //   ipaddrJS.parse(reqIP).range() == "private" ? externalIP : reqIP
  // }`;
  // console.log(req.ip, reqIP, ipURL);
  // fetch(ipURL)
  //   .then((rj) => {
  //     return rj.json();
  //   })
  //   .then((dt) => {
  //     const cond = locationVar.find((ct) => {
  //       return ct.toLowerCase() === dt.country_code.toLowerCase();
  //     });

  //     if (locationVar == "all" ? true : cond) {
  //       jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
  //         const findContact = (entry) => {
  //           return entry == decoded.contact;
  //         };
  //         const filterContact = (entry) => {
  //           return entry !== decoded.contact;
  //         };

  //         if (err) {
  //           console.log(err);
  //           res.status(401).send("Unauthorized");
  //           return;
  //         }
  //         if (serverUseTime.find(findContact)) {
  //           req.body.contact = decoded.contact;
  //           next();
  //         }
  //       });
  //     } else {
  //       res.status(401).send("Wrong country");
  //       setTimeout(() => {
  //         isRestServerOn ? ResponseToResApiUser(6) : process.exit(6);
  //       }, 1000);
  //     }
  //   });
  jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
    const findContact = (entry) => {
      return entry == decoded.contact;
    };
    const filterContact = (entry) => {
      return entry !== decoded.contact;
    };

    if (err) {
      console.log("Time for approval is finished or invalid token");
      logPath ? WriteLog(`Unauthorized or expired Token ${err}`) : "";

      res.status(401).send("Unauthorized");
      return;
    }
    if (isRestServerOn) {
      if (serverUseTimeRa[req.port].find(findContact)) {
        logPath ? WriteLog("Valid Token") : "";
        req.body.contact = decoded.contact;
        next();
      }
    } else {
      if (serverUseTime.find(findContact)) {
        logPath ? WriteLog("Valid Token") : "";
        req.body.contact = decoded.contact;
        next();
      }
    }
  });
};

const totpValidate = (req, res, next) => {
  const tp = req.params.totp;
  const filterContact = (entry) => {
    return entry !== req.body.contact;
  };

  if (isRestServerOn) {
    try {
      if (TotpAllowRa[req.port]) {
        const encoded = base32.encode(req.body.contact);
        const secret = TOTPObject[req.port].secret + encoded;
        const token = totp(secret, TOTPObject[req.port]);

        if (token == tp) {
          serverUseTimeRa[req.port] =
            serverUseTimeRa[req.port].filter(filterContact);
          approvalsRa[req.port];
          logPath ? WriteLog("Valid TOTP") : "";

          return next();
        }
        logPath ? WriteLog("Wrong or expired TOTP") : "";

        res.status(401).send("Wrong TOTP");
        setTimeout(() => {
          isRestServerOn ?clearTimeout(timeOutRa[req.port]):"";
          isRestServerOn ? req.davidServerClose(7) : process.exit(7);
        }, 1000);
      } else {
        serverUseTimeRa[req.port] =
          serverUseTimeRa[req.port].filter(filterContact);
        approvalsRa[req.port] -= 1;

        return next();
      }
    } catch (err) {
      res.send({ code: 5 })
      req.davidServerClose(5)
      isRestServerOn ?clearTimeout(timeOutRa[req.port]):"";

      console.log(err);
    }
  } else {
    if (TotpAllow) {
      const encoded = base32.encode(req.body.contact);
      const secret = TOTPObject.secret + encoded;
      const token = totp(secret, TOTPObject);

      if (token == tp) {
        serverUseTime = serverUseTime.filter(filterContact);
        approvals -= 1;
        logPath ? WriteLog("Valid TOTP") : "";

        return next();
      }
      logPath ? WriteLog("Wrong or expired TOTP") : "";

      res.status(401).send("Wrong TOTP");
      setTimeout(() => {
        isRestServerOn ?clearTimeout(timeOutRa[req.port]):"";

        isRestServerOn ? req.davidServerClose(7) : process.exit(7);
      }, 1000);
    } else {
      serverUseTime = serverUseTime.filter(filterContact);
      approvals -= 1;

      return next();
    }
  }
};

module.exports = { tokenReceiver, totpValidate };
