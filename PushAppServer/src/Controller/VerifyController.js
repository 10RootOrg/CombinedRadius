const { WriteLog } = require("../Model/Logger");

const phase2 = async (req, res) => {
  try {
    console.log(req.body.contact + " approved");
    logPath ? WriteLog(`${req.body.contact} approved`) : "";
    isRestServerOn ?console.log(serverUseTimeRa):"";
    if (serverUseTime.length == 0 || serverUseTimeRa[req.port].length == 0) {
      res.send(
        "<html> <body><h1> Hello And Welcome To Response Page</h1> <br> <h2> You Approved Access </h2></body></html>"
      );
      setTimeout(() => {
        isRestServerOn ? clearTimeout(timeOutRa[req.port]) : "";
        isRestServerOn ? req.davidServerClose(0) : process.exit(0);
      }, 1500);
    } else if (isRestServerOn ? approvalsRa[req.port] === 0 : approvals === 0) {
      // console.log(approvals + " approved");

      res.send(
        "<html> <body><h1> Hello And Welcome To Response Page</h1> <br> <h2> You Approved Access </h2></body></html>"
      );
      setTimeout(() => {
        isRestServerOn ? clearTimeout(timeOutRa[req.port]) : "";
        isRestServerOn ? req.davidServerClose(8) : process.exit(8);
      }, 1500);
    } else {
      res.send(
        `<html> <body><h1> Hello ${req.body.contact} And Welcome To Response Page</h1> <br> <h2> You Approved Access </h2></body></html>`
      );
    }
  } catch (err) {
    isRestServerOn
      ? res.send({ code: 5 })
      : res.status(500).send("didn't work!! ");
    logPath ? WriteLog(JSON.stringify(err)) : "";
    isRestServerOn ? req.davidServerClose(5) : "";
    isRestServerOn ? clearTimeout(timeOutRa[req.port]) : "";

    console.log(err);
  }
};

module.exports = { phase2 };
