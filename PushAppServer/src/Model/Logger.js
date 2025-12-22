const fs = require("fs");
const path = require("path");

const WriteLog = (text, code) => {
  if (path.extname(logPath) != ".txt") {
    console.log("Log File Must Be a txt file");
    process.exit(5);
  }
  const data = fs.readFileSync(logPath, { flag: "a+" }).toString().split("\n");
  const timeStringEmail = new Date();
  data.push(
    text != "End"
      ? `${timeStringEmail.toLocaleDateString(
          "en-GB"
        )}-${timeStringEmail.toLocaleTimeString("en-GB", {
          timeZoneName: "short",
        })}     ` + text
      : `------------------- End Of Process Exit code ${code} -------------------`
  );
  while (data.length >= 1001) {
    data.shift();
  }
  const fileString = data.join("\n");
  fs.writeFileSync(logPath, fileString);
};

module.exports = { WriteLog };
