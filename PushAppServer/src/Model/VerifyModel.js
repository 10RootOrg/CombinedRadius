const crypto = require("crypto");
const fs = require("fs");
const RSA = require("hybrid-crypto-js").RSA;
const Crypt = require("hybrid-crypto-js").Crypt;
const QRCode = require("qrcode");
const path = require("path");
const { WriteLog } = require("./Logger");

const GenerateKeys = (info, pathToKeys) => {
  const rsa = new RSA();
  try {
    if (!fs.existsSync(pathToKeys)) {
      fs.mkdirSync(pathToKeys);
    }

    rsa.generateKeyPair(function (keyPair) {
      const publicKey = keyPair.publicKey;
      const privateKey = keyPair.privateKey;

      fs.writeFileSync(`${pathToKeys}\\${info}-public.pem`, publicKey);
      fs.writeFileSync(`${pathToKeys}\\${info}-privateKey.pem`, privateKey);
    }, 1024); // Key size
    logPath ? WriteLog(`Keys generated at ${pathToKeys}`) : "";

    return true;
  } catch (err) {
    console.log(err);
    logPath ? WriteLog(JSON.stringify(err)) : "";
  }
};

const readKeyPrivate = (path) => {
  try {
    const key = fs.readFileSync(path, "utf8");
    return key;
  } catch (err) {
    console.log("You Have Entered A Wrong Path ");
    logPath ? WriteLog(JSON.stringify(err)) : "";
  }
};

const readKeyPublic = (path) => {
  const key = fs.readFileSync(path, "utf8");
  return key;
};

const signMassage = (info, privatekey) => {
  try {
    var crypt = new Crypt({ md: "sha256" });

    var signature = crypt.signature(privatekey, info);

    return signature;
  } catch (err) {
    console.log(err);
    logPath ? WriteLog(JSON.stringify(err)) : "";
  }
};

const qrCodeGen = (info, publicKey, path) => {
  try {
    const data = JSON.stringify({
      massage: info,
      key: publicKey,
    });

    QRCode.toFile(
      path,
      data,
      {
        errorCorrectionLevel: "H",
      },
      function (err) {
        if (err) throw err;
      }
    );
    logPath ? WriteLog(`QR code generated at ${path}`) : "";
  } catch (err) {
    console.log(err);
    logPath ? WriteLog(JSON.stringify(err)) : "";
  }
};

const encryptText = (plainText) => {
  return crypto.publicEncrypt(
    {
      key: fs.readFileSync("public.pem", "utf8"),
    },
    Buffer.from(plainText)
  );
};

const decryptText = (encryptedText) => {
  return crypto.privateDecrypt(
    {
      key: fs.readFileSync("private_key.pem", "utf8"),
      // In order to decrypt the data, we need to specify the
      // same hashing function and padding scheme that we used to
      // encrypt the data in the previous step
    },
    encryptedText
  );
};

module.exports = {
  GenerateKeys,
  decryptText,
  encryptText,
  signMassage,
  readKeyPrivate,
  qrCodeGen,
  readKeyPublic,
};
