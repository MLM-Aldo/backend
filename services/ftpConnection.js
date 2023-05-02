const ftp = require("basic-ftp");
// Setup the FTP Connection and Keep it Alive everytime
const ftpClient = new ftp.Client();
ftpClient.ftp.verbose = true;

async function ftpStart() {
  await ftpClient
    .access({
      host: "sparkendeavors.in",
      user: "u540517340.cdn",
      password: "sB20K77!gyL@",
      secure: false,
    })
    .then(async () => {
     // console.log("FTP Connection Established");
    })
    .catch((err) => {
      console.log("FTP Connection Error: ", err);
    });
}
// if FTP is closed then reconnect it
setInterval(async () => {
  if (ftpClient.closed) {
    await ftpStart();
  }
}, 10000);

// export upload function
module.exports.uploadFile = async (file, dir, path) => {
  try {
    await ftpClient.ensureDir(dir);
    await ftpClient.uploadFrom(file, path);
    console.log("File Uploaded Successfully");
  } catch (err) {
    console.log("Error in Uploading File: ", err);
  }
};

// export ftpStart();
module.exports.ftpStart = ftpStart;
