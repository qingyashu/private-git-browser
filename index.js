const express = require("express");
const fs = require('fs');

const directoryPath = '../qq/';

var app = express();
app.use(express.static('public/'));

app.listen(3000, function () {
  console.log('Server listening on port 3000!');
});

// log in module
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

/**
 * list file under path
 * res.send(obj). obj: [ {filename: 'filename, type: 'file' / 'dir'}, ...]
 */
app.get('/ls', function(req, res) {
  var fileList = [];
  var path = directoryPath + req.query.path;
  var type;
  fs.readdir(path, (err, files) => {
    
    // TODO
    var filePointer = files.entries(); 
    while (filePointer.next().done)

      type = 'file';
      fs.stat(path + '/' + file, (err, stats) => {
        if (stats.isFile()) type = 'file';
        else if (stats.isDirectory()) type = 'dir';
        else type = undefined;
        console.log(file, type);
        fileList.push({
          filename: file, 
          type: type
        });
      });

    

    console.log(fileList);

    res.send(fileList);
  });
});

app.get('/cat', function(req, res) {
  var filePath = directoryPath + '/' + req.query.filename;
  console.log(filePath);
  fs.readFile(filePath, 'utf8', (err, data) => {
    console.log('get', data);
    res.send(data);
  });
});