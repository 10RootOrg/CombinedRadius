#!/usr/bin/env node

// const express = require("express");
// const app = express();
const https = require("https");
const VerifyRoute = require("./src/Routes/VerifyRoute");
const os = require("os");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const TOKEN_SECRET = "ankasbhfjlasbhfhkjsabf15125asfsaf11";
const yargs = require("yargs");
const ip = require("ip");
const getFQDN = require("get-fqdn");
const { execSync } = require("child_process");
const {
  signMassage,
  readKeyPrivate,
  qrCodeGen,
  GenerateKeys,
  readKeyPublic,
} = require("./src/Model/VerifyModel");
const {
  qrCodeWizard,
  ConfigFileWizard,
  totpWizard,
} = require("./src/Model/WizardMode");
const { ConfigRun } = require("./src/Model/ConfigModel");
global.pubIp = "0.0.0.0";
async function axiosReq() {
  try {
    const controller = new AbortController();
    const errNoConnect = setTimeout(() => {
      controller.abort();
      console.log("Unable to get External ip");
    }, 2500);

    const res = await fetch("http://checkip.amazonaws.com", {
      signal: controller.signal,
      method: "GET",
    });
    await clearTimeout(errNoConnect);
    const resJson = await res.text();
    pubIp = resJson.trim();
    return true;
  } catch (err) {
    console.log("error During External Ip Get", err);
  }
}

const userName = os.userInfo().username;
const hostName = os.hostname();
const base32 = require("hi-base32");
const totp = require("totp-generator");
const path = require("path");
const { ManualConfigCreate } = require("./src/Model/ManualWizard");
const { WriteLog } = require("./src/Model/Logger");
const { normalServer } = require("./src/Servers/normalUseServer");
const { RestServer } = require("./src/Servers/RestServer");

const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
  if (
    name === `warning` &&
    typeof data === `object` &&
    data.name === `ExperimentalWarning`
    //if you want to only stop certain messages, test for the message here:
    //&& data.message.includes(`Fetch API`)
  ) {
    return false;
  }
  return originalEmit.apply(process, arguments);
};

// app.use(express.json());

// app.use("/Verify", VerifyRoute);
// Secure Tunnel Protocol Setup
const tunnelSetUp = async (PORT, way) => {
  //   const tunnel = await localtunnel(PORT);
  // global.tunnelUrl = tunnel.url;
  // console.log(3);
  //   tunnel.on("close", () => {
  //     // tunnels are closed
  //   });
  // ip.address()    pubIp
  global.tunnelUrl = `http://${
    way.toLowerCase() === "private" ? ip.address() : pubIp
  }:${PORT}`;
  logPath
    ? WriteLog(
        `server running on Port ${PORT} Network Type is ${way} url is ${tunnelUrl}`
      )
    : "";
};
// Get True Ip Of Request
// app.enable("trust proxy");
// command line interface creation
// const Credential = {
//   key: fs.readFileSync("./src/Security/Key.pem"),
//   cert: fs.readFileSync("./src/Security/cert.pem"),
// };
// const server = https.createServer(Credential, app);

const argv = yargs
  .usage(
    ` 
                                                                                                            
                                                                                                            
111111        000000000     RRRRRRRRRRRRRRRRR                                              tttt          
1::::1      00:::::::::00   R::::::::::::::::R                                          ttt:::t          
1::::1    00:::::::::::::00 R::::::RRRRRR:::::R                                         t:::::t          
1::::1   0:::::::000:::::::0RR:::::R     R:::::R                                        t:::::t          
1::::1   0::::::0   0::::::0  R::::R     R:::::R   ooooooooooo      ooooooooooo   ttttttt:::::ttttttt    
1::::1   0:::::0     0:::::0  R::::R     R:::::R oo:::::::::::oo  oo:::::::::::oo t:::::::::::::::::t    
1::::1   0:::::0     0:::::0  R::::RRRRRR:::::R o:::::::::::::::oo:::::::::::::::ot:::::::::::::::::t    
1::::l   0:::::0 000 0:::::0  R:::::::::::::RR  o:::::ooooo:::::oo:::::ooooo:::::otttttt:::::::tttttt    
1::::l   0:::::0 000 0:::::0  R::::RRRRRR:::::R o::::o     o::::oo::::o     o::::o      t:::::t          
1::::l   0:::::0     0:::::0  R::::R     R:::::Ro::::o     o::::oo::::o     o::::o      t:::::t          
1::::l   0:::::0     0:::::0  R::::R     R:::::Ro::::o     o::::oo::::o     o::::o      t:::::t          
1::::l   0::::::0   0::::::0  R::::R     R:::::Ro::::o     o::::oo::::o     o::::o      t:::::t    tttttt
1::::1110:::::::000:::::::0RR:::::R     R:::::Ro:::::ooooo:::::oo:::::ooooo:::::o      t::::::tttt:::::t
1::::1  00:::::::::::::00 R::::::R     R:::::Ro:::::::::::::::oo:::::::::::::::o      tt::::::::::::::t
1::::1   00:::::::::00   R::::::R     R:::::R oo:::::::::::oo  oo:::::::::::oo         tt:::::::::::tt
111111     000000000     RRRRRRRR     RRRRRRR   ooooooooooo      ooooooooooo             ttttttttttt  
                                                               

        \nWelcome To the help section of our application 
        \n
this program needs to connect to the following ips:
To get external IP
http://checkip.amazonaws.com

To send Emails
smtp.gmail.com
smtp.office365.com

To send Phone notification
https://exp.host/--/api/v2/push/send
    \n  Exit codes: \n
    0    Success\n
    1    Denied\n
    2    Server Ran Out Of Time\n
    3    Signature Not Verified\n
    4    No Action Flags p/g/e/c\n
    5    Error\n
    6    Tried To access Unauthorized Location\n
    7    Wrong TOTP Sent By The User\n
    8    Majority Approval Received \n
    9    Not in Client's List of Allowed Locations\n
    10   Rest ApI Password is wrong\n
    11   Port Is In use

 

     `
  )
  .options({
    phoneid: {
      alias: "p",
      describe:
        "Specify PhoneIDs to receive notifications \n(separate with spaces, e.g., id1 id2 id3) \n",
      type: "array",
    },

    location: {
      alias: "w",
      type: "array",

      describe: `Specify the server's location using -w.lat -w.lon \n(latitude longitude)\n`,
    },
    email: {
      alias: "e",
      describe:
        "Send notifications to specified email addresses \n(separate with spaces, e.g., email1 email2 email3)  \n",
      type: "array",
    },
    totpemail: {
      alias: "y",
      describe:
        "Specify the email address for sending TOTP codes \n Note: This feature is only for use with phones\n",
      type: "array",
    },
    ttl: {
      describe: "Set the validity period for the request in seconds  \n",
      alias: "t",
      default: 60,
      type: "number",
    },
    description: {
      alias: "d",
      describe:
        "Include a message description with the Email\\Notification  \n",
      default: "the sender was lazy",
      type: "array",
    },
    LOG: {
      alias: "l",
      describe: "Enable console logging (true/false) \n",
    },
    LOGfile: {
      alias: "f",
      describe:
        "Enable writing logs to a file.\n Provide the file path must be (.txt)\n",
    },
    generate: {
      alias: "g",
      describe:
        "Generate a public-private key pair in RSA format and a QR code.\n run without wizard as -g.path and -g.company\n",
    },
    privatekey: {
      alias: "k",
      describe: "Absolute Path to Private Key \n",
      type: "string",
    },
    emailhost: {
      describe: "Specify the sender's email host \n",
      alias: "h",

      choices: ["Gmail", "Office365"],
    },
    senderemail: {
      alias: "s",
      describe: "Specify the sender's email address   \n",
      type: "string",
    },
    passwordemail: {
      alias: "a",
      describe:
        "App password for the sender's email \n(generate: https://support.google.com/mail/answer/185833?hl=en)  \n",
      type: "string",
    },
    configfile: {
      alias: "c",
      describe: "Use a pre-made JSON configuration file   \n",
    },
    createconfigfile: {
      alias: "b",
      describe: `Create a JSON config file using a wizard (follow the automation legend below)
      for wizard run -b alone  \n\n
      Provide the following information using flags:\n
      -b.Path              Specify the path where the config file will be created (required)\n
      -b.IpWay             Set the approval/denial link address (Private/Public, required)\n
      -b.LOG               Enable detailed logging (true/false, required)\n
      -b.Name              Specify the file name (without extension, required)\n
      -b.Description       Provide the message description (required)\n
      -b.EmailHost         Set the email host for default sender (Gmail by default, required)\n
      -b.TTL               Set the validity period for the request (required)\n
      -b.WayOfNotification Specify how the message will be sent (Phone/Email/Both, required)\n
      -b.TOTP              Enable TOTP (true/false, required).Note: This feature is only for use with phones\n
      -b.Port              Set the server port (required)\n
      -b.TOTPOptions       Configure TOTP security options (declare with -b.TOTP)
      \n|    -b.TOTPOptions.digits Length of TOTP 3-10 digits (default: 3)
      \n|    -b.TOTPOptions.algorithm "SHA-1","SHA-224","SHA-256","SHA-384","SHA-512","SHA3-224","SHA3-256","SHA3-384","SHA3-512" (default: "SHA-1") 
      \n|    -b.TOTPOptions.secret secret in base32format(RFC3548,RFC 4648)  
        \n
      -b.PhoneID           Specify Phone IDs (e.g., -b.PhoneID 1 -b.PhoneID 2)\n
      -b.TOTPEmail         Specify TOTP email addresses (e.g., -b.TOTPEmail 1 -b.TOTPEmail 2), Note: This feature is only for use with phones\n
      -b.email             Specify email addresses (e.g., -b.email 1 -b.email 2)\n
      -b.SenderEmail       Set the Gmail sender's email address\n
      -b.PasswordEmail     Provide the Gmail app password\n
      -b.location          Specify server location using -b.location.lat latitude -b.location.lon longitude\n
      -b.approvals         Set minimum required approvals (a deny will terminate the request)\n
      -b.LOGfile           Enable writing logs to a file. Provide the file path\n
      `,
    },
    TOTP: {
      alias: "o",
      describe: `Enable TOTP security (follow the options below),
      the TTL declared with --TTL\n Note: This feature is only for use with phones
      for wizard run -o\n
      for automation follow the legend:
      \n-o.digits Set TOTP length (3-10 digits, default: 3)
      \n-o.algorithm "SHA-1","SHA-224","SHA-256","SHA-384","SHA-512","SHA3-224","SHA3-256","SHA3-384","SHA3-512" (default: "SHA-1") 
      \n-o.secret secret in base32format(RFC3548,RFC 4648)  
        \n`,
    },
    port: {
      describe: "Set local server port  \n",
      alias: "z",
      default: 8080,
      type: "number",
    },

    ipway: {
      describe: "Set the address type for approval/denial links \n",
      alias: "i",
      default: "public",
      choices: ["private", "public"],
    },
    approvers: {
      describe:
        "Set minimum required approvals for request success (a single deny ends the process) \n",
      alias: "m",
      type: "number",
    },
    RestApiMode: {
      describe: `The server will always be on and listen on ip\\restApi \n request to the api most be POST and their body have the following fields:\n
    must have :\n
      port -- The port for the Request server\n
      TTL --  How Long you want the request to be open\n
      Description  -- The description that will be send with the email\\notification \n
      passWord -- The Password that was defined in the start od the restApi Server -f flag \n
      WayOfNotification -- What you wish to send Email,Phone,Both \n
      privatekey -- absolute path to the key on The server machine \n
      Email\\Phoneid or both depends on WayOfNotification -- @("email1\\Phoneid1","email2\\Phoneid2") the device you want to send to the email\\notification\n

    optional:\n
    minApproval -- How Many people should approve before the request is resolved\n
    allowTotp -- Do You want to have Totp In your phone notification \n
    TotpObject -- the object for totp @{
      digits=5
      algorithm="SHA3-384"
      period=60
      }\n
      SenderEmail -- Specify the sender's email address \n
      PasswordEmail -- App password for the sender's email \n(generate: https://support.google.com/mail/answer/185833?hl=en) \n
      emailHost -- host of sender email (Gmail,Office365) \n
      UrlIpType -- will the request be on an external network or internal\n
      location -- location of the server @{ longitude= "32.05"
 latitude="34.78" } \n

      
      `,
      alias: "r",
      type: "boolean",
    },
    RestApiModeActiveRequest: {
      describe:
        "how Many requests can the server process (How Many Temporary servers to open) \n",
      alias: "f",
      default: 5,
      type: "number",
    },
    RestApiModePassWord: {
      describe:
        "passWord For Allowing Server Access MUST be one word no spaces \n",
      alias: "v",
      default: "10Root",
    },
    ExternalServerPort: {
      describe:
        "if you want to have an external server that will redirect all requests from outside to the temp port they came from \n",
      alias: "x",
      type: "number",
    },
  })
  .string("description")
  .string("location")
  // validate flags that need to be together
  .implies("emailhost", ["senderemail", "passwordemail"])
  .implies("passwordemail", ["senderemail", "emailhost"])
  .implies("senderemail", ["passwordemail", "emailhost"])
  .implies("email", ["privatekey"])
  .implies("phoneid", ["privatekey"])
  .implies("configfile", ["privatekey"])

  .implies("totpemail", ["TOTP"])

  .check((argv) => {
    if (argv.TOTP) {
      if (argv.TOTP.digits) {
        if (argv.TOTP.digits >= 3 && argv.TOTP.digits <= 10) {
          return true;
        } else {
          throw new Error(
            `digits must be a number between 3-10 you put ${argv.TOTP.digits}`
          );
        }
      }
    }

    if (
      argv.approvers ||
      Object.is(argv.approvers, NaN) ||
      argv.approvers === 0
    ) {
      if (!Object.is(argv.approvers, NaN)) {
        if (
          argv.approvers >
          (argv.email ? argv.email.length : 0) +
            (argv.phoneid ? argv.phoneid.length : 0)
        ) {
          console.log(
            `approvers cant be higher then max number of respondents ${
              (argv.email ? argv.email.length : 0) +
              (argv.phoneid ? argv.phoneid.length : 0)
            }`
          );
          process.exit(5);
        }
        if (argv.approvers <= 0) {
          console.log(`approvers has to be bigger then 0`);
          process.exit(5);
        } else return true;
      } else {
        console.log("Majority approval Needs to be a Number");
        process.exit(5);
      }
    }

    return true;
  })
  .example([
    ["\n----- Example 0 - generate keys and qr -----\n"],
    ["$0 -g  "],
    [
      "Please on first use generate a KeyPair And a QRCode For use To verify the signature.      \n",
    ],
    ["----- Example 1 -  send a push notification to phone  -----\n "],
    [
      '$0  -p phoneID1 phoneID2  -d some text  -t 180 -k "Absolute Path To Private Key" -o -w.lat 11 -w.lon 16 \n',
    ],
    [
      "The notification will expire in 3 minutes with some description, TOTP and a wizard to help create the totp.\n",
    ],
    ["----- Example 2 - send a push notification with no totp wizard -----\n"],
    [
      '$0  -p phoneID1 phoneID2  -d some text -t 180 -k "Absolute Path To Private Key" -o.digits 5 -0.algorithm SHA-256 \n',
    ],
    [
      "The notification will expire in 3 minutes with some description and TOTP length of 5 and algorithm of SHA-256  \n",
    ],
    [
      "----- Example 3 - send a push notification to area restricted Phone -----\n",
    ],
    [
      '$0  -p phoneID1 phoneID2  -d some text -t 180 -k "Absolute Path To Private Key" --location \n',
    ],
    [
      "The notification will expire in 3 minutes with some description that will have a location wizard open to fill with the location of the server \n",
    ],
    ["----- Example 4 - send an email and push notification -----\n"],
    [
      '$0 -e mail1@mail.com mail2@mail.com -t 180 -p phoneID -d some text -k "Absolute Path To Private Key" \n',
    ],
    [
      "send an email and push notification. that will expire in 3 minutes with some description \n",
    ],
    ["----- Example 5 - send an email -----\n"],
    ['$0 -e mail@mail.com -t 240 -k "Absolute Path To Private Key" \n'],
    ["send an email that will expire in 6 min  \n"],
    ["----- Example 6 - email with debug in console -----\n"],
    ['$0 --email mail@mail.com --LOG -k "Absolute Path To Private Key" \n'],
    [
      "send an email that will expire in 1 min and you will be able to see what is logged to console \n",
    ],
    ["----- Example 7 - make config with wizard -----\n"],
    ["$0 -b \n"],
    ["Make A JSON File For Quicker Use With Wizard  \n"],
    ["----- Example 8 - make config no wizard -----\n"],

    [
      '$0  -b.Path "C:\\Config" -b.Port 5555 -b.Name "Hello test" -b.Description "hello there" -b.TTL 666 -b.WayOfNotification Email -b.TOTP false  -b.Email Email@gmail.com -b.LOG false -b.location.lat 11.0000 -b.location.lon 0 -b.IpWay Public \n',
    ],
    ["Make A JSON File For Quicker Use Without Wizard \n"],
    ["----- Example 9 - pre made config use -----\n"],
    ['$0 -c "Absolute path to json file" -k "Absolute Path To Private Key" \n'],
    ["Use A Pre-Made JSON File   \n"],
    ["----- Example 10 - pre made config use with file logger -----\n"],
    [
      '$0 -c "Absolute path to json file" -k "Absolute Path To Private Key" -f "path to file" \n',
    ],
    [
      "Use A Pre-Made JSON File  and write to a .txt file (must be a txt) can create the path \n",
    ],
    [
      "----- Example 11 - send a push notification with no totp wizard and min approvals -----\n",
    ],
    [
      '$0  -p phoneID1 phoneID2 phoneID3 phoneID4 phoneID5 -d some text -t 180 -k "Absolute Path To Private Key" -o.digits 5 -0.algorithm SHA-256 -m 3 \n',
    ],
    [
      "The notification will expire in 3 minutes with some description and TOTP length of 5 and algorithm of SHA-256 with the -m flag you can say how many approvals you need for the process to succeed in this case at least 3 need to approve a single deny will end the process  \n",
    ],
    ["----- Example 12 - Activate RestApi Mode  -----\n"],
    ["$0 -r -l -v TestCase -f 9 -z 9999 \n"],
    [
      " Will Activate a rest Server that will listen on port 9999, and will enable console logging, The server will allow at most 9 servers(requests) at the same time, The password to Use the server will be TestCase with out this the request will NOT start. the -z -f -v are all optional as they have default values (see Options part of help) ",
    ],
    [
      "----- Example 13 - Activate RestApi Mode with external server port -----\n",
    ],
    ["$0 -r -l -v TestCase -f 9 -z 9999 -x 5656 \n"],
    [
      " Same AS example 12 but with this you will only need to open one port to the outside ",
    ],
  ])
  .strict()
  .wrap(yargs.terminalWidth())
  .help().argv;

runPro();
async function runPro() {
  await axiosReq();
  global.logPath =
    typeof argv.LOGfile === "string"
      ? argv.LOGfile
      : undefined || typeof argv.LOGfile === "boolean"
      ? `./logs/logFile.txt`
      : undefined;
  global.isRestServerOn = false;
  if (argv.RestApiMode) {
    logPath
      ? WriteLog("---------- Start Rest Api Server Process ----------")
      : "";
    global.RestApiServerDavid = [];
    global.TotpAllowRa = {};
    global.PrivateKey = {};
    global.SignatureMessage = {};
    global.locationVar = {};
    global.serverUseTimeRa = {};
    global.approvalsRa = {};
    global.timeOutRa = {};
    global.serverUseTime = false;
    global.isExternalServer = argv.ExternalServerPort
      ? argv.ExternalServerPort
      : false;
    RestServer(
      argv.port,
      argv.LOG,
      argv.RestApiModeActiveRequest,
      argv.RestApiModePassWord
    );
  } else {
    if (argv.generate) {
      if (argv.generate === true) {
        logPath ? WriteLog("---------- Start Process ----------") : "";
        await qrCodeWizard();
      } else {
        if (argv.generate.company) {
          if (argv.generate.path) {
            logPath ? WriteLog("---------- Start Process ----------") : "";

            await GenerateKeys(argv.generate.company, argv.generate.path);
            setTimeout(() => {
              const publicKey = readKeyPublic(
                `${argv.generate.path}\\${argv.generate.company}-public.pem`
              ).toString();

              qrCodeGen(
                argv.generate.company,
                publicKey,
                `${argv.generate.path}\\${argv.generate.company}-qrCode.png`
              );

              setTimeout(() => {
                console.log(process.exit(0));
                process.exit(0);
              }, 900);
            }, 1900);
          } else {
            console.log("Wrong Parameter name");
            logPath ? WriteLog("Wrong Parameter name") : "";

            await qrCodeWizard();
          }
        } else {
          console.log("Wrong Parameter name");
          logPath ? WriteLog("Wrong Parameter name") : "";

          await qrCodeWizard();
        }
      }
    } else {
      if (argv.ttl > 2000000) {
        argv.ttl = 1999999;
        console.log("TTL To High Therefor It Has Been Set To 1999999");
        logPath
          ? WriteLog("TTL To High Therefor It Has Been Set To 1999999")
          : "";
      }
      const filterContact = (entry) => {
        return entry !== "";
      };

      global.locationVar = {
        longitude: argv.location ? argv.location.lon : undefined,
        latitude: argv.location ? argv.location.lat : undefined,
      };
      global.TotpAllow = argv.TOTP;
      argv.privatekey
        ? (global.PrivateKey = await readKeyPrivate(argv.privatekey).toString())
        : "";
      argv.privatekey
        ? (global.SignatureMessage = path.basename(
            argv.privatekey,
            "-privateKey.pem"
          ))
        : "";

      global.TOTPObject = {
        period: argv.ttl,
        timestamp: Date.now(),
      };
      if (argv.createconfigfile || argv.configfile) {
        if (argv.configfile) {
          const file = fs.readFileSync(argv.configfile, "utf8");
          const data = JSON.parse(file);
          global.EmailHost =
            data.EmailHost == "Gmail"
              ? "smtp.gmail.com"
              : data.EmailHost == "Office365"
              ? "smtp.office365.com"
              : data.EmailHost == "Outlook"
              ? "smtp.office365.com"
              : "";
          global.TotpAllow = data.TOTP;
          global.approvals = data.approvers;
          global.logPath = data.LOGfile;

          logPath ? WriteLog("---------- Start Process ----------") : "";
          await tunnelSetUp(data.Port, data.IpWay);

          global.TOTPObject = data.TOTPOptions
            ? {
                ...data.TOTPOptions,
                timestamp: Date.now(),
                secret:
                  data.TOTPOptions.secret || "NBSWY3DPEBGXSICOIFWWKICJOMQEA2",
              }
            : {
                timestamp: Date.now(),
                digits: 3,
                algorithm: "SHA-1",
                secret: "NBSWY3DPEBGXSICOIFWWKICJOMQEA2",
              };
          data.Email = data.Email.filter(filterContact);
          data.PhoneID = data.PhoneID.filter(filterContact);
          locationVar = {
            longitude: data.location.longitude || undefined,
            latitude: data.location.latitude || undefined,
          };
          global.serverUseTime = [
            ...(data.Email ? data.Email : ""),
            ...(data.PhoneID ? data.PhoneID : ""),
          ];
          setTimeout(() => {
            console.log(process.exit(2));
            process.exit(2);
          }, (data.TTL + 20) * 1000);

          // server.listen(data.Port, () => {
          //   argv.LOG ? console.log(`Port: ${data.Port}`) : "";
          // });
          normalServer(data.Port, data.LOG);
          // app.listen(data.Port, () => {
          //   data.LOG ? console.log(`Port: ${data.Port}`) : "";
          // });
          ConfigRun(data);
        } else if (argv.createconfigfile) {
          if (argv.createconfigfile == true) {
            await ConfigFileWizard();
          } else {
            if (typeof argv.createconfigfile === "object") {
              await ManualConfigCreate(argv.createconfigfile);
            }
          }
        }
      } else {
        const runStuff = async () => {
          await setTimeout(() => {
            console.log(process.exit(2));
            process.exit(2);
          }, (argv.ttl + 20) * 1000);
          logPath ? WriteLog("---------- Start Process ----------") : "";

          // server.listen(argv.port, () => {
          //   argv.LOG ? console.log(`Port: ${argv.port}`) : "";
          // });
          await tunnelSetUp(argv.port, argv.ipway);
          global.EmailHost =
            argv.emailhost == "Gmail"
              ? "smtp.gmail.com"
              : argv.emailhost == "Office365"
              ? "smtp.office365.com"
              : argv.emailhost == "Outlook"
              ? "smtp.office365.com"
              : "smtp.gmail.com";

          normalServer(argv.port, argv.LOG);
          // app.listen(argv.port, () => {
          //   argv.LOG ? console.log(`Port: ${argv.port}`) : "";
          // });
          global.serverUseTime = [
            ...(argv.email ? argv.email : ""),
            ...(argv.phoneid ? argv.phoneid : ""),
          ];

          global.approvals = argv.approvers;

          for (let i = 0; i < serverUseTime.length; i++) {
            const encoded = base32.encode(serverUseTime[i]);
            const secret = TOTPObject.secret + encoded;
            const token = totp(secret, TOTPObject);
            console.log(`${serverUseTime[i]} token `, token);
          }

          if (argv.phoneid) {
            if (argv.totpemail) {
              for (let i = 0; i < argv.totpemail.length; i++) {
                const element = argv.totpemail[i];
                sendTOTPEmail(argv, element);
              }
            }
            for (let i = 0; i < argv.phoneid.length; i++) {
              const requestTime = Date.now();
              const requestID =
                requestTime + "d" + Math.random().toString(36).slice(2, 4);
              const PhoneID = argv.phoneid[i];
              await sendnoti(argv, requestID, requestTime, PhoneID);
            }
          }
          if (argv.email) {
            for (let i = 0; i < argv.email.length; i++) {
              const requestTime = Date.now();

              const requestID =
                requestTime + "d" + Math.random().toString(36).slice(2, 4);
              const Email = argv.email[i];
              await sendEmail(argv, requestID, requestTime, Email);
            }
          }
        };

        if (argv.phoneid || argv.email) {
          if (argv.TOTP) {
            if (argv.TOTP === true) {
              await totpWizard();
            } else {
              if (typeof argv.o === "object") {
                global.TOTPObject = {
                  ...TOTPObject,
                  digits: argv.TOTP.digits || 3,
                  algorithm: argv.TOTP.algorithm || "SHA-1",
                  secret: argv.TOTP.secret || "NBSWY3DPEBGXSICOIFWWKICJOMQEA2",
                };
              } else {
                console.log("totp -o not written correctly ");
                process.exit(5);
              }
            }
          }

          await runStuff();
        } else {
          console.log("please use --help to learn how to use the app");
          logPath
            ? WriteLog("please use --help to learn how to use the app")
            : "";

          console.log(process.exit(4));

          process.exit(4);
        }
      }
    }
  }
}

async function sendnoti(info, requestID, requestTime, PhoneID) {
  let FQDN = "no internet access";
  try {
    FQDN = await getFQDN();
  } catch (error) {
    console.log("cant access the required site to get the fqdn");
  }

  try {
    const signature = signMassage(SignatureMessage, PrivateKey);
    const token = jwt.sign({ contact: PhoneID }, TOKEN_SECRET, {
      expiresIn: info.ttl,
    });
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: `ExponentPushToken[${PhoneID}]`,
        title: `Hi ${userName}  `,
        body: `You have conditional Access Request from ${hostName}`,
        data: {
          message: SignatureMessage,
          signature: signature,
          phase2url: `${tunnelUrl}/Verify/accept/${token}/`,
          nourl: `${tunnelUrl}/Verify/reject/${token}`,
          noVerify: `${tunnelUrl}/Verify/noVerify/${token}`,
          uuid: requestID,
          time: requestTime,
          description: info.description,
          user: userName,
          internalIP: ip.address(),
          externalIP: pubIp,
          ttl: info.ttl,
          host: hostName,
          fqdn: FQDN,
          TOTP: info.TOTP,
          TOTLength: TOTPObject.digits,
          location: locationVar,
          noLocationUrl: `${tunnelUrl}/Verify/wrongLocation/${token}`,
        },
      }),
    });
    const x = await res.json();
    info.LOG ? console.log("notification", x.data) : "";
    logPath ? WriteLog(`notification ${JSON.stringify(x)}`) : "";
  } catch (err) {
    console.log(err);
    logPath ? WriteLog(`notification ${JSON.stringify(err)}`) : "";

    process.exit(5);
  }
}

async function sendEmail(info, requestID, requestTime, Email) {
  try {
    let FQDN = "no internet access";
    try {
      FQDN = await getFQDN();
    } catch (error) {
      console.log("cant access the required site to get the fqdn");
    }
    if (Email !== "") {
      const token = jwt.sign({ contact: Email }, TOKEN_SECRET, {
        expiresIn: info.ttl,
      });

      const encoded = base32.encode(Email);

      const secret = TOTPObject.secret + encoded;

      const tot = info.TOTP ? totp(secret, TOTPObject) : 111;

      let transporter = nodemailer.createTransport({
        host: EmailHost,
        secure: false,
        auth: {
          user: info.senderemail || "risx@10root.com",
          pass: info.passwordemail || "jebrgejyqbmgnqyz",
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: "SSLv3",
        },
      });
      const timeStringEmail = new Date(requestTime);
      let action = await transporter.sendMail({
        from: info.senderemail || "risx@10root.com",
        to: `${Email}`,
        subject: "Authentication of access",
        text: "A New Phone Tried To Access Your Account Press The Link If! You Agree To it If Not DO Nothing",
        html: ` <div >
        <h1 style="font-size: 14px; font-family: Arial;color:  #8b8b8b;" >Conditional Access Request:</h1>
                <h3 style="font-size: 19px; font-family: Arial; max-width: 350px;color: #444444; line-height: 24px; margin-top: 5px;">Someone Has Tried To Enter Your Account From a Unregistered Device </h3>
        
                <!-- <p style="font-size: 14px; font-family: Arial; line-height: 20px;">
                Request ID: ${requestID}<br>
                Time: ${timeStringEmail.toLocaleTimeString("en-GB", {
                  timeZoneName: "short",
                })} -
                ${timeStringEmail.toLocaleDateString("en-GB")}<br>
                 Hostname:"my name" ${hostName}<br> 
                FQDN: ${FQDN}<br>
                Internal IP: ${ip.address()}<br>
                External IP: ${pubIp}<br>
                User: ${userName}<br>
                Description: ${info.description}<br>        
                Duration: ${info.ttl}<br>
                </p> -->
                
                <table style="font-family: 'Arial', sans-serif;color: #444444; font-size: 14px;text-align: left; margin-bottom: 20px;">
        
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" width: 110px;  font-weight: normal;">Request ID</td><td style=" font-weight: bold;" >${requestID}</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">Time</td><td style=" font-weight: bold;" >${timeStringEmail.toLocaleTimeString(
                          "en-GB",
                          { timeZoneName: "short" }
                        )} -${timeStringEmail.toLocaleDateString("en-GB")}</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">Hostname</td><td style=" font-weight: bold;" >${hostName}</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">FQDN</td><td style=" font-weight: bold;" >${FQDN}</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">Internal IP</td><td style=" font-weight: bold;" >${ip.address()}</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">External IP</td><td style=" font-weight: bold;" >${pubIp}</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">User</td><td style=" font-weight: bold;" >${userName}</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">Description</td><td style=" font-weight: bold;" >${
                          info.description
                        }</td>
                    </tr>
                    <tr  style=" height:  25px ; line-height: 20px;" >
                        <td style=" font-weight: normal;">Duration</td><td style=" font-weight: bold;" >${
                          info.ttl
                        }</td>
                    </tr>
        
                  </table>
                  
            <a font href="${tunnelUrl}/Verify/accept/${token}/${tot}"><button style="background-color:#1EBE54; font-size: 14px; padding: 5px 25px ; color: #ffffff; border: 0; border-radius: 5px;  width: 124px; margin-right: 8px;"> Approve &#10003;</button></a>       
            <a font href="${tunnelUrl}/Verify/reject/${token}"><button style="background-color:#E13738; font-size: 14px; padding: 5px 25px ; color: #ffffff; border: 0; border-radius: 5px;width: 124px"> Deny &#10006;</button></a>  <br>   
            </div>`,
      });
      info.LOG
        ? console.log(` Email log ${
            action.accepted[0] !== "" ? "Accepted" : "Rejected"
          } \n 
      Response: ${action.response}
      Message Id: ${action.messageId}
      Message Size: ${action.messageSize}
      Message Time: ${action.messageTime}
      Envelope Time: ${action.envelopeTime}     `)
        : "";
      logPath ? WriteLog(`email ${JSON.stringify(action)}`) : "";
    } else {
      return console.log("no email");
    }
  } catch (err) {
    console.log(err);
    logPath ? WriteLog(`email ${JSON.stringify(err)}`) : "";

    process.exit(5);
  }
}

async function sendTOTPEmail(info, Email) {
  try {
    let emailText = `\n`;
    for (let i = 0; i < serverUseTime.length; i++) {
      const encoded = base32.encode(serverUseTime[i]);
      const secret = TOTPObject.secret + encoded;
      const token = totp(secret, TOTPObject);
      emailText =
        emailText + ` THE TOTP Code For ${serverUseTime[i]} is ${token}\n`;
    }

    let transporter = nodemailer.createTransport({
      host: EmailHost,
      secure: false,
      auth: {
        user: info.senderemail || "risx@10root.com",
        pass: info.passwordemail || "jebrgejyqbmgnqyz",
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: "SSLv3",
      },
    });
    let action = await transporter.sendMail({
      from: info.SenderEmail || "risx@10root.com",
      to: `${Email}`,
      subject: "Authentication of access",
      text: `The TOTP Codes Are : ${emailText}`,
    });
    info.LOG
      ? console.log(` Email log ${
          action.accepted[0] !== "" ? "Accepted" : "Rejected"
        } \n 
      Response: ${action.response}
      Message Id: ${action.messageId}
      Message Size: ${action.messageSize}
      Message Time: ${action.messageTime}
      Envelope Time: ${action.envelopeTime}     `)
      : "";
    logPath ? WriteLog(`email totp ${JSON.stringify(action)}`) : "";
  } catch (err) {
    console.log(err);
    logPath ? WriteLog(`email totp ${JSON.stringify(err)}`) : "";

    process.exit(5);
  }
}

process.on("exit", (code) => {
  logPath ? WriteLog("End", code) : "";
  if (isRestServerOn) {
    if (RestApiServerDavid.length >= 1) {
      for (let i = 0; i < RestApiServerDavid.length; i++) {
        RestApiServerDavid[i].res.send({ code: 5 });
      }
    }
  }
  console.log("Exit Code of " + code);
});

function kill(signal) {
  console.log(`you forcefully terminated the process ${signal}`);
  logPath ? WriteLog(`you forcefully terminated the process ${signal}`) : "";

  process.exit(5);
}

process.on("SIGINT", kill);

process.on("SIGTERM", kill);
process.on("SIGQUIT", kill);
