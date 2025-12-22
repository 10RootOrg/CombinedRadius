
const os = require("os");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const TOKEN_SECRET = "ankasbhfjlasbhfhkjsabf15125asfsaf11";
const ip = require("ip");
const getFQDN = require("get-fqdn");

const userName = os.userInfo().username;
const hostName = os.hostname();
const base32 = require("hi-base32");
const totp = require("totp-generator");
const { WriteLog } = require("./src/Model/Logger");


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



module.exports = { sendEmail };