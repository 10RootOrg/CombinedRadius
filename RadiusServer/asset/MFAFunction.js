const { WriteLog } = require("./Logger");
const { exec } = require("child_process");

async function MFAIntervalFunction(Data, jsonSettings, fileDate) {
  try {
    WriteLog(
      "Start Mfa Send To " + Data.FullNameUser,
      `Interval/IntervalLog_${fileDate}`
    );
    let xObj;
    try {
// This is for Getting the email in the domain 

      // const child = await exec(
      //   [
      //     `$ForestObj=[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()`,
      //     `$Dom = $ForestObj.RootDomain.Name`,
      //     `$DE = New-Object System.DirectoryServices.DirectoryEntry -ArgumentList "GC://dc=${Data.FullNameUser.split(
      //       "@"
      //     )[1]
      //       .split(".")
      //       .join(",dc=")}"`,
      //     `$objSearcher = New-Object System.DirectoryServices.DirectorySearcher -ArgumentList $DE`,
      //     `$objSearcher.Filter = ("samaccountname= ${
      //       Data.FullNameUser.split("@")[0]
      //     }")`,
      //     `$objSearcher.PropertiesToLoad.add("mail") >$null`,
      //     `$objSearcher.FindOne() | ConvertTo-Json`,
      //   ].join(" ; "),
      //   { shell: "powershell.exe" },
      //   (error, stdout, stderr) => {
      //     // do whatever with stdout
      //     try {
      //       WriteLog(
      //         "error : " + error.stack,
      //         `Interval/IntervalLog_${fileDate}`
      //       );
      //       console.log("stderr", stderr);
      //       xObj = JSON.parse(stdout);
      //     } catch (err) {
      //       console.log(
      //         "Problem of exec look up",
      //         err
      //       );
      //     }
      //   }
      // );
      // const tempE = await new Promise((resolve, reject) => {
      //   child.on("exit", (code) => {
      //     console.log(`PowerShell script exited with code ${code}`);
      //     if (code === 0) {
      //       resolve("true");
      //     } else if (code === 1) {
      //       resolve("error code 1");
      //     } else {
      //       resolve("false");
      //     }
      //   });
      // });
    } catch (error) {
      WriteLog(
        `Error in Trying to get user from domain for ${Data.FullNameUser} In Interval: ${error.stack}`,
        `Interval/IntervalLog_${fileDate}`
      );
    }

    if (
      ([...(jsonSettings.PHONELIST ?? []), ...(Data?.PhoneList ?? [])]?.filter(
        (x) => x
      ).length > 0 &&
        ((Data?.WAYOFNOTIFICATION ?? jsonSettings.WAYOFNOTIFICATION) ==
          "Phone" ||
          (Data?.WAYOFNOTIFICATION ?? jsonSettings.WAYOFNOTIFICATION) ==
            "Both")) ||
      ([
        ...(xObj?.Properties?.mail ?? []),
        ...(jsonSettings.EMAILLIST ?? []),
        ...(Data?.EmailList ?? []),
      ].filter((x) => x).length > 0 &&
        ((Data?.WAYOFNOTIFICATION ?? jsonSettings.WAYOFNOTIFICATION) ==
          "Email" ||
          (Data?.WAYOFNOTIFICATION ?? jsonSettings.WAYOFNOTIFICATION) ==
            "Both"))
    ) {
      WriteLog(
        "Sending req to Risx Server ",
        `Interval/IntervalLog_${fileDate}`
      );

      const json = {
        port: Data?.PORT ?? Number(jsonSettings.PORT),
        Email: [
          ...(xObj?.Properties?.mail ?? []),
          ...(jsonSettings.EMAILLIST ?? []),
          ...(Data?.EmailList ?? []),
        ].filter((x) => x),
        PhoneID: [
          ...(jsonSettings.PHONELIST ?? []),
          ...(Data?.PhoneList ?? []),
        ]?.filter((x) => x),
        minApproval: Data?.minApproval ?? jsonSettings.minApproval,
        TTL: Data?.TTL ?? Number(jsonSettings.TTL),
        Description: Data?.DESCRIPTION ?? jsonSettings.DESCRIPTION,
        allowTotp: Data?.ALLOWTOTP ?? jsonSettings.ALLOWTOTP,
        TotpObject: {
          digits:
            Data?.TOTPOBJECTdigits ?? Number(jsonSettings.TOTPOBJECTdigits),
          timestamp: new Date(),
          algorithm:
            Data?.TOTPOBJECTalgorithm ?? jsonSettings.TOTPOBJECTalgorithm,
          period:
            Data?.TOTPOBJECTperiod ?? Number(jsonSettings.TOTPOBJECTperiod),
        },
        SenderEmail: Data?.SENDEREMAIL ?? jsonSettings.SENDEREMAIL,
        PasswordEmail: Data?.PASSWORDEMAIL ?? jsonSettings.PASSWORDEMAIL,
        emailHost: Data?.EMAILHOST ?? jsonSettings.EMAILHOST,
        passWord: jsonSettings.PASSWORD,
        UrlIpType: Data?.URLIPTYPE ?? jsonSettings.URLIPTYPE,
        WayOfNotification:
          Data?.WAYOFNOTIFICATION ?? jsonSettings.WAYOFNOTIFICATION,
        location: {
          longitude:
            Data?.LOCATIONlongitude ?? Number(jsonSettings.LOCATIONlongitude),
          latitude:
            Data?.LOCATIONlatitude ?? Number(jsonSettings.LOCATIONlatitude),
        },
        privatekey: Data?.PRIVATEKEY ?? jsonSettings.PRIVATEKEY,
        userName: Data.FullNameUser.split("@")[0],
        MinPhoneApproval:
          Data?.MinPhoneApproval ?? jsonSettings.MinPhoneApproval ?? 0,
        StaticIp: Data?.StaticIp ?? jsonSettings.StaticIp,
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
        WriteLog(
          "Response from Risx Server " + JSON.stringify(res),
          `Interval/IntervalLog_${fileDate}`
        );

        if (res.code == 0 || res.code == 8) {
          WriteLog(
            `Accept For ${Data.FullNameUser}`,
            "Interval/IntervalActiveApproval.txt"
          );
        } else if (res.code == 1) {
          WriteLog(
            `Reject For ${Data.FullNameUser}`,
            "Interval/IntervalActiveApproval.txt"
          );
        } else if (res.code == 2) {
          WriteLog(
            `TimeOut For ${Data.FullNameUser}`,
            "Interval/IntervalActiveApproval.txt"
          );
        } else {
          WriteLog(
            `Error For ${Data.FullNameUser}`,
            "Interval/IntervalActiveApproval.txt"
          );
        }
      } catch (error) {
        WriteLog(
          "Error in access to Risx Server at " + jsonSettings.APIURL,
          `Interval/IntervalLog_${fileDate}`
        );

        throw new Error(
          "Error in Risx Server Connection Check Url Port And Firewall Rules"
        );
      }
    } else {
      WriteLog(
        `No Recipients in the chosen delivery method for ${Data.FullNameUser} In Interval`,
        `Interval/IntervalLog_${fileDate}`
      );
    }
  } catch (error) {
    WriteLog(
      `Error in Process for ${Data.FullNameUser} In Interval: ${error.stack}`,
      `Interval/IntervalLog_${fileDate}`
    );
    WriteLog(
      `Error For ${Data.FullNameUser}`,
      "Interval/IntervalActiveApproval.txt"
    );
  }
}

module.exports = { MFAIntervalFunction };
