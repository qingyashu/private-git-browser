var express = require('express');
var app = express();

app.use(express.static('public'));

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});

app.get('/list-files', function (req, res) {
  // console.log('url:', req.baseUrl);
  // console.log('params:', req.params);
  console.log('query:', req.query);
  
  var fileList = [1, 2, 3];
  res.send(fileList);
});