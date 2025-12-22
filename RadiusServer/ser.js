const fs = require("fs");

const radius = require("./asset/radius/lib/radius");
const dgram = require("dgram");
const yargs = require("yargs");
const { exec } = require("child_process");
const { WriteLog } = require("./asset/Logger");
const { MFAIntervalFunction } = require("./asset/MFAFunction");

process.on("exit", (code) => {
  WriteLog(
    `---------------- Radius Process is exited with ${code} exit code  ----------------`
  );
});

function kill(signal) {
  WriteLog(`you forcefully terminated the process ${signal}`);
  process.exit(5);
}

process.on("SIGINT", kill);

process.on("SIGTERM", kill);
process.on("SIGQUIT", kill);
process.on("uncaughtException", (err, origin) => {
  WriteLog(`Error Happened Process Killed ${err.stack}  from  ${origin}`);
  process.exit(555);
});

require("dotenv").config();
const server = dgram.createSocket("udp4");

WriteLog("Radius Server 0.2.2 ");
// WriteLog("Radius Server 0.2.2", "Interval/IntervalActiveApproval.txt");

const argv = yargs
  .options({
    jsonSettings: {
      alias: "j",
      describe: "setting for the server \n",
      demandOption: true,
    },
  })
  .strict()
  .wrap(yargs.terminalWidth())
  .help().argv;

WriteLog("hello This is Radius Start Service");
const ThresholdObjectGlobal = {};
global.IntervalTimeObj = {};

async function IntervalFunc() {
  const ddt = new Date();
  const fileDate = `${ddt.getDate().toString().padStart(2, "0")}-${(
    ddt.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${ddt.getFullYear()}`;
  WriteLog("Start Interval Run", `Interval/IntervalLog_${fileDate}`);
  const jsonSettings = await JSON.parse(
    await fs.readFileSync(argv.jsonSettings, "utf8")
  );
  const UserDirectory = await JSON.parse(
    await fs.readFileSync(jsonSettings.UserDirectory, "utf8")
  );
  const UserArray = Object.entries(UserDirectory).map((x) => {
    x[1].FullNameUser = x[0];
    return x[1];
  });
  // console.log(UserArray);
  for (let i = 0; i < UserArray.length; i++) {
    if (UserArray[i]?.Interval?.Enabled ?? jsonSettings?.Interval?.Enabled) {
      console.log("hello");
      if (!IntervalTimeObj[UserArray[i]?.FullNameUser]) {
        IntervalTimeObj[UserArray[i]?.FullNameUser] = 111111111111;
      }
      const TDate = new Date(IntervalTimeObj[UserArray[i]?.FullNameUser]);
      TDate.setMinutes(
        TDate.getMinutes() +
        (UserArray[i]?.Interval?.TimeInMinutes ??
          jsonSettings?.Interval?.TimeInMinutes)
      );
      console.log(
        TDate <= Date.now(),
        TDate,
        "TDate || Now",
        new Date(Date.now()),
        "User ",
        UserArray[i]?.FullNameUser
      );
      // WriteLog(
      //   `${TDate <= Date.now()} ${TDate} TDate || Now ${new Date(
      //     Date.now()
      //   )} User ${UserArray[i]?.FullNameUser} `,
      //   `Interval/IntervalLog_${fileDate}`
      // );
      if (TDate <= Date.now()) {
        IntervalTimeObj[UserArray[i]?.FullNameUser] = Date.now();
        MFAIntervalFunction(UserArray[i], jsonSettings, fileDate);
      }
    }
  }
  await WriteLog("End Interval Run", `Interval/IntervalLog_${fileDate}`);
}

try {
  IntervalFunc();

  setInterval(() => {
    IntervalFunc();
  }, 2 * 60 * 1000);
} catch (err) {
  WriteLog("Error in Interval :" + err.stack);
}

server.on("message", async function (msg, rinfo) {
  const reqID = (Math.random() + 1).toString(36).substring(6);
  try {
    WriteLog(
      `---------------- Radius Request Started at ${new Date().toLocaleString()} reqID ${reqID} ----------------`
    );
    WriteLog("Request from " + JSON.stringify(rinfo));
    var code, username, password, packet;
    const file = await fs.readFileSync(argv.jsonSettings, "utf8");
    const jsonSettings = await JSON.parse(file);
    var secret = jsonSettings.secret;
    const UserDirectory = await JSON.parse(
      await fs.readFileSync(jsonSettings.UserDirectory, "utf8")
    );
    try {
      packet = await radius.decode({ packet: msg, secret: secret });
      console.log(packet, "packet");
    } catch (e) {
      WriteLog("Failed to decode radius packet, silently dropping: " + e);

      return;
    }

    if (packet.code != "Access-Request") {
      WriteLog("unknown packet type: " + packet.code);

      return;
    }
    const FullName = packet.attributes["User-Name"];
    const DomainName = packet.attributes["User-Name"].split("@")[1];
    username = packet.attributes["User-Name"].split("@")[0];
    password = packet.attributes["User-Password"];
    // let email = "";

    WriteLog("Access-Request for " + FullName);

    // Start Check For Threshold
    if (
      (UserDirectory[FullName.toLowerCase()]?.Threshold?.Enabled ??
        jsonSettings?.Threshold?.Enabled) &&
      ThresholdObjectGlobal[FullName.toLowerCase()]
    ) {
      WriteLog(
        "ThresholdObjectGlobal " + JSON.stringify(ThresholdObjectGlobal)
      );

      const TDate = new Date(ThresholdObjectGlobal[FullName.toLowerCase()]);

      TDate.setMinutes(
        TDate.getMinutes() +
        (UserDirectory[FullName.toLowerCase()]?.Threshold
          ?.TimeAllowedInHours ??
          jsonSettings?.Threshold?.TimeAllowedInHours) *
        60
      );

      WriteLog(
        "Threshold in minutes: ",
        (UserDirectory[FullName.toLowerCase()]?.Threshold?.TimeAllowedInHours ??
          jsonSettings?.Threshold?.TimeAllowedInHours) * 60,
        " TDate > Date.now() ",
        TDate > Date.now()
      );
      if (TDate > Date.now()) {
        const response = radius.encode_response({
          packet: packet,
          code: "Access-Accept",
          secret: secret,
        });
        WriteLog(
          "Sending " +
          "Access-Accept" +
          " for user " +
          username +
          " as he is inside the threshold time"
        );

        server.send(
          response,
          0,
          response.length,
          rinfo.port,
          rinfo.address,
          function (err, bytes) {
            if (err) {
              WriteLog("Error sending response to " + JSON.stringify(rinfo));
            }
          }
        );

        return;
      }
    }
    // End Check For Threshold

    if (username) {
      let xObj;
      const child = exec(
        [
          `$ForestObj=[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()`,
          `$Dom = $ForestObj.RootDomain.Name`,
          `$DE = New-Object System.DirectoryServices.DirectoryEntry -ArgumentList "GC://dc=${DomainName.split(
            "."
          ).join(",dc=")}"`,
          `$objSearcher = New-Object System.DirectoryServices.DirectorySearcher -ArgumentList $DE`,
          `$objSearcher.Filter = ("samaccountname= ${username}")`,
          `$objSearcher.PropertiesToLoad.add("mail") >$null`,
          `$objSearcher.FindOne() | ConvertTo-Json`,
        ].join(" ; "),
        { shell: "powershell.exe" },
        (error, stdout, stderr) => {
          // do whatever with stdout
          error ? WriteLog("error : ", error) : "";
          console.log("stderr", stderr);
          xObj = JSON.parse(stdout);
        }
      );
      const tempE = await new Promise((resolve, reject) => {
        child.on("exit", (code) => {
          console.log(`PowerShell script exited with code ${code}`);
          if (code === 0) {
            resolve("true");
          } else if (code === 1) {
            resolve("error code 1");
          } else {
            resolve("false");
          }
        });
      });
      if (
        (xObj.Properties.mail?.length === 0 || !xObj.Properties.mail) &&
        UserDirectory[FullName.toLowerCase()]?.EmailList?.length === 0
      ) {
        var response = radius.encode_response({
          packet: packet,
          code: "Access-Reject",
          secret: secret,
        });
        WriteLog(
          "Sending " +
          "Access-Reject" +
          " for user " +
          username +
          " as he is NOT Enrolled/No Email"
        );

        server.send(
          response,
          0,
          response.length,
          rinfo.port,
          rinfo.address,
          function (err, bytes) {
            if (err) {
              WriteLog("Error sending response to " + JSON.stringify(rinfo));
            }
          }
        );

        return;
      }

      WriteLog(
        "Phone List => " +
        [
          ...(jsonSettings?.PHONELIST ?? []),
          ...(UserDirectory[FullName.toLowerCase()]?.PhoneList ?? []),
        ]?.filter((x) => x) +
        " ,    Email List => " +
        [
          ...(xObj?.Properties?.mail ?? []),
          ...(jsonSettings?.EMAILLIST ?? []),
          ...(UserDirectory[FullName.toLowerCase()]?.EmailList ?? []),
        ].filter((x) => x)
      );

      if (
        ([
          ...(jsonSettings.PHONELIST ?? []),
          ...(UserDirectory[FullName.toLowerCase()]?.PhoneList ?? []),
        ]?.filter((x) => x).length > 0 &&
          ((UserDirectory[FullName.toLowerCase()]?.WAYOFNOTIFICATION ??
            jsonSettings.WAYOFNOTIFICATION) == "Phone" ||
            (UserDirectory[FullName.toLowerCase()]?.WAYOFNOTIFICATION ??
              jsonSettings.WAYOFNOTIFICATION) == "Both")) ||
        ([
          ...(xObj?.Properties?.mail ?? []),
          ...(jsonSettings.EMAILLIST ?? []),
          ...(UserDirectory[FullName.toLowerCase()]?.EmailList ?? []),
        ].filter((x) => x).length > 0 &&
          ((UserDirectory[FullName.toLowerCase()]?.WAYOFNOTIFICATION ??
            jsonSettings.WAYOFNOTIFICATION) == "Email" ||
            (UserDirectory[FullName.toLowerCase()]?.WAYOFNOTIFICATION ??
              jsonSettings.WAYOFNOTIFICATION) == "Both"))
      ) {
        WriteLog("Sending req to Risx Server ");

        const json = {
          FullName: FullName,
          port:
            UserDirectory[FullName.toLowerCase()]?.PORT ??
            Number(jsonSettings.PORT),
          Email: [
            ...(xObj?.Properties?.mail ?? []),
            ...(jsonSettings.EMAILLIST ?? []),
            ...(UserDirectory[FullName.toLowerCase()]?.EmailList ?? []),
          ].filter((x) => x),
          PhoneID: [
            ...(jsonSettings.PHONELIST ?? []),
            ...(UserDirectory[FullName.toLowerCase()]?.PhoneList ?? []),
          ]?.filter((x) => x),
          minApproval:
            UserDirectory[FullName.toLowerCase()]?.minApproval ??
            jsonSettings.minApproval,
          TTL:
            UserDirectory[FullName.toLowerCase()]?.TTL ??
            Number(jsonSettings.TTL),
          Description:
            UserDirectory[FullName.toLowerCase()]?.DESCRIPTION ??
            jsonSettings.DESCRIPTION,
          allowTotp:
            UserDirectory[FullName.toLowerCase()]?.ALLOWTOTP ??
            jsonSettings.ALLOWTOTP,
          TotpObject: {
            digits:
              UserDirectory[FullName.toLowerCase()]?.TOTPOBJECTdigits ??
              Number(jsonSettings.TOTPOBJECTdigits),
            timestamp: new Date(),
            algorithm:
              UserDirectory[FullName.toLowerCase()]?.TOTPOBJECTalgorithm ??
              jsonSettings.TOTPOBJECTalgorithm,
            period:
              UserDirectory[FullName.toLowerCase()]?.TOTPOBJECTperiod ??
              Number(jsonSettings.TOTPOBJECTperiod),
          },
          SenderEmail:
            UserDirectory[FullName.toLowerCase()]?.SENDEREMAIL ??
            jsonSettings.SENDEREMAIL,
          PasswordEmail:
            UserDirectory[FullName.toLowerCase()]?.PASSWORDEMAIL ??
            jsonSettings.PASSWORDEMAIL,
          emailHost:
            UserDirectory[FullName.toLowerCase()]?.EMAILHOST ??
            jsonSettings.EMAILHOST,
          passWord: jsonSettings.PASSWORD,
          UrlIpType:
            UserDirectory[FullName.toLowerCase()]?.URLIPTYPE ??
            jsonSettings.URLIPTYPE,
          WayOfNotification:
            UserDirectory[FullName.toLowerCase()]?.WAYOFNOTIFICATION ??
            jsonSettings.WAYOFNOTIFICATION,
          location: {
            longitude:
              UserDirectory[FullName.toLowerCase()]?.LOCATIONlongitude ??
              Number(jsonSettings.LOCATIONlongitude),
            latitude:
              UserDirectory[FullName.toLowerCase()]?.LOCATIONlatitude ??
              Number(jsonSettings.LOCATIONlatitude),
          },
          privatekey:
            UserDirectory[FullName.toLowerCase()]?.PRIVATEKEY ??
            jsonSettings.PRIVATEKEY,
          userName: username,
          MinPhoneApproval:
            UserDirectory[FullName.toLowerCase()]?.MinPhoneApproval ??
            jsonSettings.MinPhoneApproval ??
            0,
          StaticIp:
            UserDirectory[FullName.toLowerCase()]?.StaticIp ??
            jsonSettings.StaticIp,
        };
        try {
          const x = await fetch(jsonSettings.APIURL, {
            body: JSON.stringify(json),
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const res = await x.json();
          WriteLog("Response from Risx Server " + JSON.stringify(res));

          if (res.code == 0 || res.code == 8) {
            WriteLog("Access-Accept");
            if (
              UserDirectory[FullName.toLowerCase()]?.Threshold?.Enabled ??
              jsonSettings?.Threshold?.Enabled
            ) {
              ThresholdObjectGlobal[FullName.toLowerCase()] =
                new Date().toLocaleString("en-GB");
            }

            code = "Access-Accept";
          } else {
            WriteLog("Access-Reject");
            code = "Access-Reject";
          }
        } catch (error) {
          WriteLog("Error in access to Risx Server At " + jsonSettings.APIURL);

          throw new Error(
            "Error in Risx Server Connection Check Url Port And Firewall Rules"
          );
        }
      } else {
        WriteLog("no recipients in the chosen method");

        code = "Access-Reject";
      }
    } else {
      WriteLog("not valid user " + username);

      code = "Access-Reject";
    }
    WriteLog("The Code is " + code);

    var response = radius.encode_response({
      packet: packet,
      code: code,
      secret: secret,
    });
    WriteLog("Sending " + code + " for user " + username);

    server.send(
      response,
      0,
      response.length,
      rinfo.port,
      rinfo.address,
      function (err, bytes) {
        if (err) {
          WriteLog("Error sending response to " + JSON.stringify(rinfo));
        }
      }
    );

    WriteLog(
      `---------------- Radius Request Ended at ${new Date().toLocaleString()} reqID ${reqID} ----------------`
    );
  } catch (error) {
    console.log(error);

    WriteLog("Error occurred during message Processing :  " + error.stack);
  }
});

server.on("listening", function () {
  var address = server.address();
  WriteLog("radius server listening " + address.address + ":" + address.port);
});

server.bind(8888);
