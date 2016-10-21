const express = require("express");
const fs = require('fs');

const g_directoryPath = '../stm2016-html-i18n-task01/';
const git = require('simple-git')(g_directoryPath);

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
 * req.query: {path: path}
 * res.send(obj). obj: [ {filename: 'filename, type: 'file' / 'dir'}, ...]
 */
app.get('/ls', function(req, res) {
  var fileList = [];
  var path = g_directoryPath + req.query.path;
  var type;
  fs.readdir(path, (err, files) => {
    
    var filePointer = files.entries(); 
    var readStats = function(p) {
      var next = p.next();
      if (next.done) {
        res.send(fileList);
        return;
      }
      console.log(next);
      var filename = next.value[1];
      fs.stat(path + '/' + filename, (err, stats) => {
        if (stats.isFile()) type = 'file';
        else if (stats.isDirectory()) type = 'dir';
        else type = undefined;
        console.log(filename, type);
        fileList.push({
          filename: filename, 
          type: type
        });
        readStats(p);
      });
    };
    readStats(filePointer);
    
  });
});

const typesMap = {
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.wav': 'audio/wav'
};
/**
 * cat file
 * req.query: {filename: filename}
 * res.send({success: boolean, data: data})
 */
app.get('/cat', function(req, res) {
  var filePath = g_directoryPath + '/' + req.query.filename;
  fs.exists(filePath, (exists) => {
    if (!exists) {
      res.type('application/json');
      res.send({
        success: false
      });
      return;
    }
    
    res.type('text/plain');
    var mediaType = false;
    for (var type in typesMap) {
      if (filePath.endsWith(type)) {
        res.type(typesMap[type]);
        mediaType = true;
        break;
      }
    }

    console.log(res.get('Content-Type'));
    fs.readFile(filePath, (err, data) => {
      console.log(data);
      res.send({
        success: true,
        data: data.toString('base64'),
        mediaType: mediaType,
        type: res.get('Content-Type')
      });
    });

  });
});

/**
 * write file , or create file if not exists
 * req.query: {filename: filename, content: content}
 * res.send(boolean success)
 */
app.post('/write', function(req, res) {
  var filePath = g_directoryPath + '/' + req.query.filename;
  fs.writeFile(filePath, req.query.content, 'utf8', (err) => {
    if (err) {
      res.send({
        success: false,
        err: err
      });
      return;
    }
    res.send({
      success: true
    });
    return;
  });
});

/** 
 * git_push
 */
app.get('/git_push', function(req, res) {
  git.push(['origin', 'master'], function(err, info) {
    if (err) {
      res.send({
        success: false,
        err: err
      });
      return;
    }
    res.send({
      success: true,
      info: info
    });
    return;
  });
});

/**
 * git_commit 
 * req.query: {message: message}
 */
app.get('/git_commit', function(req, res) {
  git.add('.')
      .commit(req.query.message, function(err, info) {
        if (err) {
          res.send({
            success: false,
            err: err
          });
          return;
        }
        res.send({
          success: true,
          info: info
        });
        return;
      });
});

/**
 * git_pull 
 */
app.get('/git_pull', function(req, res) {
  git.pull(function(err, update) {
    if (err) {
      res.send({
        success: false,
        err: err
      });
      return;
    }
    res.send({
      success: true,
      update: update
    });
    return;
  });
});
