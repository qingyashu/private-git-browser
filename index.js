const express = require("express");

const fs = require('fs');
var app = express();
app.use(express.static('public/'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

app.get('/list-files', function (req, res) {
  console.log('query:', req.query);
  const testFolder = '../qq/';
  var fileList;
  fs.readdir(testFolder, (err, files) => {
    fileList = files.map(file => file);
    res.send(fileList);
  });
});

app.get('/login', function(req, res) {
  var name = req.query.name;
  var pswd = req.query.pswd;
  fs.readFile('./data/passwd', 'utf8', (err, data) => {
    var lines = data.split('\r\n');
    var line, content;
    for (line of lines) {
      content = line.split(',');
      if (content.length == 2 && content[0] === name && content[1] === pswd) {
        res.send(true);
        return;
      }
    }
    res.send(false);
    return;
  });
});