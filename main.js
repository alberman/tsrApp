//jshint esversion:8
const pcsclite = require("pcsclite");
const pcsc = pcsclite();
const http = require("http");
var fs = require('fs');
var qs = require('querystring');
const { app, BrowserWindow } = require('electron');



console.log("Hello World!");

cmd_select = new Buffer.from([0x00, 0xa4, 0x08, 0x00, 0x04, 0x11, 0x00, 0x11, 0x02, 0x00,]);
cmd_command = new Buffer.from([0x00, 0xb0, 0x00, 0x00, 0xfd]);



pcsc.on("reader", function (reader) {
  console.log("New reader detected", reader.name);

  reader.on("error", function (err) {
    console.log("Error(", this.name, "):", err.message);
  });

  reader.on("status", function (status) {
    console.log("Status(", this.name, "):", status);
    /* check what has changed */
    var changes = this.state ^ status.state;
    if (changes) {
      if (changes & this.SCARD_STATE_EMPTY && status.state & this.SCARD_STATE_EMPTY) {
        console.log("card removed"); /* card removed */
        
        
        reader.disconnect(reader.SCARD_LEAVE_CARD, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Disconnected");
          }
        });
      } else if (changes & this.SCARD_STATE_PRESENT && status.state & this.SCARD_STATE_PRESENT) {
        console.log("card inserted"); /* card inserted */
        reader.connect({ share_mode: this.SCARD_SHARE_SHARED }, function (err, protocol) {
            if (err) {
              console.log(err);
            } else {
              console.log("Protocol(", reader.name, "):", protocol);
              reader.transmit(cmd_select, 255, 2, function (err, data) {
                  if (err) {
                    console.log(err);
                  } else {
                    // console.log("Data received", data);
                    reader.transmit(cmd_command, 255, 2, function (err, data) {
                        if (err) {
                          console.log(err);
                        } else {
                          let daya = data.toString();
                          console.log("Data received", daya);
                          
                          var options = {
                            'method': 'POST',
                            'hostname': 'localhost',
                            'port': 3000,
                            'path': '/',
                            'headers': {
                              'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            'maxRedirects': 20
                          };

                          var req = http.request(options, function (res) {
                            var chunks = [];

                            res.on("data", function (chunk) {
                              chunks.push(chunk);
                            });

                            res.on("end", function (chunk) {
                              var body = Buffer.concat(chunks);
                              console.log(body.toString());
                            });

                            res.on("error", function (error) {
                              console.error(error);
                            });
                          });

                          var postData = qs.stringify({
                            'data': daya
                          });

                          req.write(postData);

                          req.end();






                          
                          

                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  });

  reader.on("end", function () {
    console.log("Reader", this.name, "removed");
  });
});

pcsc.on("error", function (err) {
  console.log("PCSC error", err.message);
});


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});