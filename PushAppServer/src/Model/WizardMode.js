const { GenerateKeys, readKeyPublic, qrCodeGen } = require("./VerifyModel");
const fs = require("fs");
const inquirer = require("inquirer");
const { WriteLog } = require("./Logger");
const qrCodeWizard = async () => {
  console.log(
    " ----------Hello and welcome to RisxApp Setup--------------------"
  );
  console.log(
    "In Here We Will Walk You through the first steps of the program you have received from 10Root "
  );
  console.log(
    "You will now go through a quick initialization of the program after it ends please run the following command and read the examples"
  );
  console.log(" --help ");
  inquirer
    .prompt([
      /* Pass your questions in here */
      {
        type: "input",
        name: "companyName",
        message: "Company",
        validate: (answer) => {
          if (answer === "") {
            return "Please add your Company's Name ";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "pathName",
        message: "Keys Path ",
        validate: (answer) => {
          if (answer === "") {
            return "Please add your Keys Path ";
          }
          return true;
        },
      },
    ])
    .then(async (answers) => {
      // Use user feedback for... whatever!!
      console.log("A QR code and Pair of Keys will be generated now");
      await GenerateKeys(answers.companyName, answers.pathName);
      setTimeout(() => {
        const publicKey = readKeyPublic(
          `${answers.pathName}\\${answers.companyName}-public.pem`
        ).toString();

        qrCodeGen(
          answers.companyName,
          publicKey,
          `${answers.pathName}\\${answers.companyName}-qrCode.png`
        );

        setTimeout(() => {
          console.log(process.exit(0));
          process.exit(0);
        }, 900);
      }, 1900);
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.log(error);
        logPath
          ? WriteLog("Prompt couldn't be rendered in the current environment")
          : "";
      } else {
        // Something else went wrong
        console.log(error);
        logPath ? WriteLog(JSON.stringify(err)) : "";
      }
    });
};

const ConfigFileWizard = async () => {
  console.log(
    " ----------Hello and welcome to RisxApp Config Setup--------------------"
  );
  console.log(
    "In Here we will guide You through Creating a Config file that will help you run the program faster and more efficiently "
  );
  inquirer
    .prompt([
      /* Pass your questions in here */
      {
        type: "input",
        name: "Route",
        message:
          "Absolute path to the folder were the file will be in (no quotes in the beginning or end)",
        validate: (answer) => {
          if (answer === "") {
            return "Please add a path  ";
          }
          if (answer.startsWith(" ")) {
            return "Remove space from start of string";
          }
          if (
            answer.startsWith('"') ||
            answer.startsWith("'") ||
            answer.startsWith("`")
          ) {
            return "Remove quotes from start of string";
          }
          if (
            answer.endsWith('"') ||
            answer.endsWith("'") ||
            answer.endsWith("`")
          ) {
            return "Remove quotes from End of string";
          }
          return true;
        },
      },
      {
        type: "number",
        name: "Port",
        message: "Port for the server to run on ",

        default: 8080,
      },
      {
        type: "input",
        name: "Message",
        message: "Choose file name (without extension)",
        validate: (answer) => {
          if (answer === "") {
            return "Please add a Name  ";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "Message description ",
        validate: (answer) => {
          if (answer === "") {
            return "Please add Some Description  ";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "IpWay",
        message: "Network type to use",
        choices: ["Private", "Public"],
      },
      {
        type: "number",
        name: "TTL",
        message: "Message  duration in seconds ",
        validate: (input) => {
          if (input === "") {
            return "Please provide a valid number greater then 0";
          }
          return true;
        },
        filter: (input) => {
          // clear the invalid input
          return Number.isNaN(input) || Number(input) <= 0 ? "" : Number(input);
        },
      },
      {
        type: "confirm",
        name: "geo",
        default: true,
        message: "Do you want To add GeoLocation ",
      },
      {
        type: "input",
        name: "latitude",
        message: "Latitude of server location ",
        when: (answers) => {
          return answers.geo;
        },
      },
      {
        type: "input",
        name: "longitude",
        message: "Longitude of server location ",
        when: (answers) => {
          return answers.geo;
        },
      },
      {
        type: "confirm",
        name: "smtp",
        default: false,
        message: "Use private smtp ",
      },
      {
        type: "list",
        name: "EmailHost",
        message: "Email host Of Thee email that will send the emails  ",
        choices: ["Gmail", "Office365"],
        when: (answers) => {
          return answers.smtp;
        },
      },
      {
        type: "input",
        name: "SenderEmail",
        message: "Email You  want To SEND The Email From ",
        when: (answers) => {
          return answers.smtp;
        },
        validate: (answer) => {
          if (answer === "") {
            return "Please add a Email  ";
          }
          return true;
        },
      },
      {
        type: "password",
        name: "emailPassword",
        message: "App Password Of Your Email ",
        when: (answers) => {
          return answers.smtp;
        },
        validate: (answer) => {
          if (answer === "") {
            return "Please add a Password  ";
          }
          return true;
        },
      },

      {
        type: "list",
        name: "LOG",
        message: "do you want LOG  ",
        choices: ["No", "Console Only", "To File", "Both"],
      },
      {
        type: "input",
        name: "LOGfile",
        message:
          "Absolute path to log file(.txt){with file name} path will be created if it doesn't exist ",
        validate: (answer) => {
          if (answer === "") {
            return "Please add a path  ";
          }
          if (answer.startsWith(" ")) {
            return "Remove space from start of string";
          }
          if (
            answer.startsWith('"') ||
            answer.startsWith("'") ||
            answer.startsWith("`")
          ) {
            return "Remove quotes from start of string";
          }
          if (
            answer.endsWith('"') ||
            answer.endsWith("'") ||
            answer.endsWith("`")
          ) {
            return "Remove quotes from End of string";
          }
          return true;
        },
        when: (answers) => {
          return answers.LOG === "To File" || answers.LOG === "Both";
        },
      },
      {
        type: "confirm",
        name: "TOTP",
        default: false,
        message: "do you want TOTP  ",
      },
      {
        type: "input",
        name: "digits",
        message: "How long is the Totp(3-10) ",
        validate: (answer) => {
          if (answer === "") {
            return "Please add Number";
          }
          if (answer >= 3 && answer <= 10) {
            return true;
          }
          return "Has To Be Between 3-10";
        },
        when: (answers) => {
          return answers.TOTP;
        },
      },
      {
        type: "list",
        name: "algorithm",
        message: "What algorithm would you like to use ",
        choices: [
          "SHA-1",
          "SHA-224",
          "SHA-256",
          "SHA-384",
          "SHA-512",
          "SHA3-224",
          "SHA3-256",
          "SHA3-384",
          "SHA3-512",
        ],
        when: (answers) => {
          return answers.TOTP;
        },
      },
      {
        type: "input",
        name: "secret",
        message:
          "The secret has to be in the base32 (RFC3548,RFC 4648) format there is a default ",
        when: (answers) => {
          return answers.TOTP;
        },
      },
      {
        type: "input",
        name: "TOTPEmail",
        message: "Email to send a Totp code for the phone To ",

        when: (answers) => {
          return answers.TOTP;
        },
      },
      {
        type: "list",
        name: "wayOfNotification",
        message:
          "Where would you like to send the request phone, email or both",
        choices: ["Phone", "Email", "Both"],
      },
      {
        type: "input",
        name: "phoneId",
        message:
          "PhoneID's of phones you want to send the notifications To (when more then 1, separate with spaces, ie: id1 id2 id3) ",
        validate: (answer) => {
          if (answer === "") {
            return "Please add Some Description  ";
          }
          return true;
        },
        when: (answers) => {
          return (
            answers.wayOfNotification === "Phone" ||
            answers.wayOfNotification === "Both"
          );
        },
      },
      {
        type: "input",
        name: "email",
        message:
          "Emails to send to (when more then 1, separate with spaces, ie: email1 email2 email3 )",
        validate: (answer) => {
          if (answer === "") {
            return "Please add Some Description  ";
          }
          return true;
        },
        when: (answers) => {
          return (
            answers.wayOfNotification === "Email" ||
            answers.wayOfNotification === "Both"
          );
        },
      },
      {
        type: "confirm",
        name: "approval",
        default: false,
        message:
          "do you want to have  a minimum amount of approvals (if false all have to approve if true some can not respond a deny will close the request )  ",
      },
      {
        type: "input",
        name: "approvalsNumber",
        message: (answers) => {
          const p = answers.phoneId
            ? answers.phoneId.split(" ").filter(Boolean)
            : [];
          const e = answers.email
            ? answers.email.split(" ").filter(Boolean)
            : [];

          const numtotal = [...p, ...e];
          return `How many minimum approval's 1-${numtotal.length}`;
        },
        validate: (answer, data) => {
          const p = data.phoneId ? data.phoneId.split(" ").filter(Boolean) : [];
          const e = data.email ? data.email.split(" ").filter(Boolean) : [];

          const numtotal = [...p, ...e];
          if (answer === "") {
            return "Please add Number";
          }
          if (answer >= 1 && answer <= numtotal.length) {
            return true;
          }
          return `Has To Be Between 1-${numtotal.length}`;
        },
        when: (answers) => {
          return answers.approval;
        },
      },
    ])
    .then(async (answers) => {
      // Use user feedback for... whatever!!
      if (!fs.existsSync(answers.Route)) {
        fs.mkdirSync(answers.Route);
      }

      setTimeout(() => {
        const jsonData = {};
        jsonData.IpWay = answers.IpWay;
        answers.approval ? (jsonData.approvals = answers.approvalsNumber) : "";
        jsonData.Port = Number(answers.Port);
        jsonData.EmailHost = answers.EmailHost || "Gmail";
        jsonData.LOG =
          answers.LOG === "Console Only" || answers.LOG === "Both"
            ? true
            : false;
        answers.LOG === "To File" || answers.LOG === "Both"
          ? (jsonData.LOGfile = answers.LOGfile)
          : "";

        jsonData.Description = answers.description;
        jsonData.TTL = answers.TTL;
        jsonData.TOTP = answers.TOTP;
        answers.TOTP
          ? (jsonData.TOTPOptions = {
              secret: answers.secret || null,

              digits: answers.digits,
              algorithm: answers.algorithm,
              period: answers.TTL,
            })
          : (jsonData.TOTPOptions = {});
        answers.TOTP
          ? answers.TOTPEmail
            ? (jsonData.TOTPEmail =
                answers.TOTPEmail.split(" ").filter(Boolean))
            : ""
          : "";

        jsonData.location = {
          longitude: answers.longitude || undefined,
          latitude: answers.latitude || undefined,
        };
        jsonData.WayOfNotification = answers.wayOfNotification;
        answers.wayOfNotification == "Email" ||
        answers.wayOfNotification === "Both"
          ? (jsonData.SenderEmail =
              answers.SenderEmail == "Default Email"
                ? null
                : answers.SenderEmail)
          : null;
        answers.wayOfNotification == "Email" ||
        answers.wayOfNotification === "Both"
          ? (jsonData.PasswordEmail =
              answers.emailPassword == "Default Email"
                ? null
                : answers.emailPassword)
          : null;

        answers.wayOfNotification == "Phone" ||
        answers.wayOfNotification === "Both"
          ? (jsonData.PhoneID = answers.phoneId.split(" ").filter(Boolean))
          : (jsonData.PhoneID = []);
        answers.wayOfNotification == "Email" ||
        answers.wayOfNotification === "Both"
          ? (jsonData.Email = answers.email.split(" ").filter(Boolean))
          : (jsonData.Email = []);
        fs.writeFileSync(
          `${answers.Route}\\${answers.Message}.json`,
          JSON.stringify(jsonData)
        );
        logPath ? WriteLog(`Config File Was Created at ${answers.Route}`) : "";
        logPath = answers.LOGfile;
        logPath
          ? WriteLog(`Config File Was Created at ${answers.LOGfile}`)
          : "";
        setTimeout(() => {
          process.exit(0);
        }, 1500);
      }, 600);
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.log(error);
      } else {
        // Something else went wrong
        console.log(error);
        logPath ? WriteLog(JSON.stringify(err)) : "";
      }
    });
};

const totpWizard = async () => {
  const z = await inquirer
    .prompt([
      /* Pass your questions in here */
      {
        type: "input",
        name: "digits",
        message: "How Long Is The Totp(3-10) ",
        validate: (answer) => {
          if (answer >= 3 && answer <= 10) {
            return true;
          }
          return "Has To Be Between 3-10";
        },
      },
      {
        type: "list",
        name: "algorithm",
        message: "What algorithm would you like to use ",
        choices: [
          "SHA-1",
          "SHA-224",
          "SHA-256",
          "SHA-384",
          "SHA-512",
          "SHA3-224",
          "SHA3-256",
          "SHA3-384",
          "SHA3-512",
        ],
      },
      {
        type: "input",
        name: "secret",
        message:
          "The secret has to be in the base32 (RFC3548,RFC 4648) format ",
        default: "Enter For Default",
      },
    ])
    .then((answers) => {
      TOTPObject = {
        digits: answers.digits,
        algorithm: answers.algorithm,
        secret:
          answers.secret == "Enter For Default"
            ? "NBSWY3DPEBGXSICOIFWWKICJOMQEA2"
            : answers.secret,
        ...TOTPObject,
      };
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.log(error);
      } else {
        // Something else went wrong
        console.log(error);
      }
    });
  return z;
};

module.exports = {
  qrCodeWizard,
  ConfigFileWizard,
  totpWizard,
};
