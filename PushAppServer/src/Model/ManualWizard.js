const { GenerateKeys, readKeyPublic, qrCodeGen } = require("./VerifyModel");
const fs = require("fs");
const { ConfigFileWizard } = require("./WizardMode");
const { WriteLog } = require("./Logger");

const ManualConfigCreate = async (Data) => {
  const mustHaveKeys = [
    "Path",
    "Name",
    "Description",
    "TTL",
    "WayOfNotification",
    "TOTP",
    "Port",
    "LOG",
    "IpWay",
  ];
  try {
    if (mustHaveKeys.every((key) => Object.keys(Data).includes(key))) {
      if (!fs.existsSync(Data.Path)) {
        fs.mkdirSync(Data.Path);
      }
      if (Data.TOTP) {
        if (Data.TOTPOptions) {
        } else {
          console.log("Allowed TOTP But No TOTPOptions");
          process.exit(5);
        }
      }

      if (Data.TOTPEmail) {
        if (Data.TOTP && Data.PhoneID) {
        } else {
          console.log("Allowed TOTPEmail But didn't Allow TOTP or No PhoneID ");
          process.exit(5);
        }
      }
      if (Data.WayOfNotification) {
        if (Data.WayOfNotification == "Both") {
          if (Data.PhoneID && Data.Email) {
          } else {
            console.log(
              "Chosen Way Of Notification IS Both Missing Either PhoneID Or Email "
            );
            process.exit(5);
          }
        }
        if (Data.WayOfNotification == "Phone") {
          if (Data.PhoneID) {
          } else {
            console.log(
              "Chosen Way Of Notification IS Phone Missing  PhoneID  "
            );
            process.exit(5);
          }
        }
        if (Data.WayOfNotification == "Email") {
          if (Data.Email) {
          } else {
            console.log("Chosen Way Of Notification IS Email Missing Email ");
            process.exit(5);
          }
        }
      }
      if (Data.SenderEmail || Data.PasswordEmail) {
        if (!Data.Email) {
          console.log("Missing Email ");
          process.exit(5);
        }
        if (!Data.SenderEmail) {
          console.log("Missing Sender Email ");
          process.exit(5);
        }
        if (!Data.PasswordEmail) {
          console.log("Missing Password Email ");
          process.exit(5);
        }
      }
      if (Data.IpWay === "Private" || Data.IpWay === "Public") {
      } else {
        console.log("Missing Or Incorrect IpWay");
        process.exit(5);
      }
      if (Data.location) {
        if (!Data.location.lon) {
          console.log("Missing longitude");
          process.exit(5);
        }
        if (!Data.location.lat) {
          console.log("Missing latitude");
          process.exit(5);
        }
      }
      if (Data.approvals) {
        const p = Data.PhoneID.split(" ").filter(Boolean);
        const e = Data.Email.split(" ").filter(Boolean);

        const numtotal = [...p, ...e];
        if (!Number(Data.approvals)) {
          console.log(Data.approvals + " is not a Number");
          process.exit(5);
        }
        if (answer >= 1 && answer <= numtotal.length) {
        } else {
          console.log(`Has To Be Between 1-${numtotal.length}`);
          process.exit(5);
        }
      }
      setTimeout(() => {
        const jsonData = {};
        jsonData.IpWay = Data.IpWay;
        Data.approvals ? (jsonData.approvals = Data.approvals) : "";
        Data.LOGfile ? (jsonData.LOGfile = Data.LOGfile) : "";

        jsonData.Port = Number(Data.Port);
        jsonData.EmailHost = Data.EmailHost || "Gmail";
        jsonData.LOG = Data.LOG;
        jsonData.Description = Data.Description;
        jsonData.TTL = Data.TTL;
        jsonData.TOTP = Data.TOTP ? true : false;
        Data.TOTP
          ? (jsonData.TOTPOptions = {
              secret: Data.TOTPOptions.secret || null,

              digits: Data.TOTPOptions.digits || 3,
              algorithm: Data.TOTPOptions.algorithm || "SHA-1",
              period: Data.TTL,
            })
          : (jsonData.TOTPOptions = {});
        Data.TOTP
          ? Data.TOTPEmail
            ? (jsonData.TOTPEmail = Data.TOTPEmail.split(" "))
            : ""
          : "";

        jsonData.location = {
          longitude: Data.location ? Data.location.lon : undefined,
          latitude: Data.location ? Data.location.lat : undefined,
        };

        jsonData.WayOfNotification = Data.WayOfNotification;
        Data.WayOfNotification == "Email" || Data.WayOfNotification === "Both"
          ? (jsonData.SenderEmail = Data.SenderEmail ? null : Data.SenderEmail)
          : null;
        Data.WayOfNotification == "Email" || Data.WayOfNotification === "Both"
          ? (jsonData.PasswordEmail = Data.EmailPassword
              ? null
              : Data.EmailPassword)
          : null;

        Data.WayOfNotification == "Phone" || Data.WayOfNotification === "Both"
          ? (jsonData.PhoneID = Data.PhoneID.split(" "))
          : (jsonData.PhoneID = []);
        Data.WayOfNotification == "Email" || Data.WayOfNotification === "Both"
          ? (jsonData.Email = Data.Email.split(" "))
          : (jsonData.Email = []);
        fs.writeFileSync(
          `${Data.Path}\\${Data.Name}.json`,
          JSON.stringify(jsonData)
        );
        logPath ? WriteLog(`Config File Was Created at ${Data.Path}`) : "";
        logPath = Data.LOGfile;
        logPath ? WriteLog(`Config File Was Created at ${Data.Path}`) : "";

        setTimeout(() => {
          process.exit(0);
        }, 1500);
      }, 600);
    } else {
      console.log(
        "Wrong Parameter missing one of {Path, Name, Description, TTL, WayOfNotification, TOTP,}  here is wizard"
      );
      logPath
        ? WriteLog(
            "Wrong Parameter missing one of {Path, Name, Description, TTL, WayOfNotification, TOTP,}  here is wizard"
          )
        : "";

      await ConfigFileWizard();
    }
  } catch (err) {
    console.log(err);
    logPath ? WriteLog(JSON.stringify(err)) : "";
  }
};

module.exports = {
  ManualConfigCreate,
};
