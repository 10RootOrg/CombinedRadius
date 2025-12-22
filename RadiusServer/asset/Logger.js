const fs = require("fs");
const path = require("path");

const WriteLog = (text, dst) => {

  if (
    !fs.existsSync("Radius Logs/Process") ||
    !fs.existsSync("Radius Logs/Interval")
  ) {
    fs.mkdirSync("Radius Logs/Process", { recursive: true });
    fs.mkdirSync("Radius Logs/Interval", { recursive: true });
  }
  const ddt = new Date();
  const FileDate = `${ddt.getDate().toString().padStart(2, "0")}-${(
    ddt.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${ddt.getFullYear()}`;
  const data = fs
    .readFileSync(`Radius Logs/` + (dst ?? `Process/log_${FileDate}.txt`), {
      flag: "a+",
    })
    .toString()
    .split("\n");
  const timeStringEmail = new Date();
  data.push(
    `${timeStringEmail.toLocaleDateString(
      "en-GB"
    )}-${timeStringEmail.toLocaleTimeString("en-GB", {
      timeZoneName: "short",
    })}     ` + text
  );

  const fileString = data.join("\n");
  console.log(text);
  fs.writeFileSync(
    `Radius Logs/` + (dst ?? `Process/log_${FileDate}.txt`),
    fileString
  );
};

module.exports = { WriteLog };
