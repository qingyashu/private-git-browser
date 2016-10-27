const express = require("express");
const fs = require('fs');
const bodyParser = require('body-parser');
const compression = require('compression');

const g_directoryPath = '../test_repo/';
const git = require('simple-git')(g_directoryPath);

var removeDuplicateSlash = function(str) {
  return str.replace(/\/+/g, '/');
};

var app = express();
app.use(compression());
app.use(express.static('public/'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded

app.listen(11022, function () {
  console.log('Server listening on port 11022!');
});

// log in module
app.get('/login', function(req, res) {
  var name = req.query.name;
  var pswd = req.query.pswd;
  fs.readFile('./data/passwd', 'utf8', (err, data) => {
    var lines = data.split('\n');
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
 * res.send(obj). obj: [ {
 *   filename: filename, 
 *   type: 'file' / 'dir',
 *   path: path
 * }, ...]
 */
app.get('/ls', function(req, res) {
  console.log('====================' + req.query.path + '====================');

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
      var filename = next.value[1];
      fs.stat(path + '/' + filename, (err, stats) => {
        if (stats.isFile()) type = 'file';
        else if (stats.isDirectory()) type = 'dir';
        else type = undefined;

        var targetFilename = removeDuplicateSlash('./' + req.query.path + '/' + filename);
        console.log(targetFilename);
        git.log({'file': targetFilename}, function(err, log) {
          if (filename[0] !== '.' && log) {
            fileList.push({
              filename: filename, 
              type: type,
              path: req.query.path,
              last_date: log.latest === null ? undefined : log.latest.date,
              message: log.latest === null ? 'Not commited' : log.latest.message,
              author_name: log.latest === null ? 'Not commited' : log.latest.author_name,
              author_email: log.latest === null? 'Not commited' : log.latest.author_email
            });
          }
          readStats(p);
        });

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
  console.log(' ~~~~~~~~~~~~ ' + filePath + ' ~~~~~~~~~~~~ ');
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
    
    if (mediaType) {
      fs.readFile(filePath, (err, data) => {
        var toSend = data.toString('base64');
        res.send({
          filename: req.query.filename, 
          success: true,
          data: toSend,
          mediaType: mediaType,
          type: res.get('Content-Type')
        });
      });
    }
    else {
      fs.readFile(filePath, 'utf8', (err, data) => {
        res.send({
          filename: req.query.filename, 
          success: true,
          data: data,
          mediaType: mediaType,
          type: res.get('Content-Type')
        });
      });
    }

  });
});


/**
 * write file , or create file if not exists
 * req.query: {filename: filename, content: content}
 * res.send(boolean success)
 */
app.post('/write', function(req, res) {
  console.log(req.body);
  var filePath = g_directoryPath + '/' + req.body.filename;
  console.log('receive saving request ' + filePath);
  fs.writeFile(filePath, req.body.content, 'utf8', (err) => {
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

// TODO: remove file