'use strict';
/* global $ */
var $scope = {};

if (sessionStorage.getItem('login') !== 'true') {
  window.location = "login.html";
}

var refreshList = function() {
  console.log($scope.filelist);
  $('#directory-container').empty();
  var liNode;
  for (var file of $scope.filelist) {
    liNode = $('<li></li>');
    if (file.type === 'dir') liNode.append('<a href="#">' + file.filename + '</a>');
    else liNode.append(file.filename);
    $('#directory-container').append(liNode);
    liNode.data('filename', file.filename);
    liNode.data('path', file.path);
    liNode.data('type', file.type);
  }
  $("#directory-container").listview("refresh");
  $('#directory-container li').on('click', function() {
    var filename = $(this).data('filename');
    var path = $(this).data('path');
    var type = $(this).data('type');
    console.log(filename, path, type);
    if (type === 'dir') {
      clickDir(filename, path);
    }
    else {
      clickFile(filename, path);
    }
  });
};

var loadList = function(list) {
  list.sort(function(a, b) {
    return a.type > b.type;
  });
  $scope.filelist = [];
  for (var file of list) {
    $scope.filelist.push({
      filename: file.filename, 
      path: file.path,
      type: file.type
    });
  }
  console.log($scope.filelist);
};

var loadFile = function(responseData) {
  console.log(responseData);
  if (responseData.mediaType === false) { // text
    $('#file-viewer').html(responseData.data);
  }
  else {
    console.log(responseData.type);
    var classType = responseData.type.split('/')[0];
    if (classType === 'image') {
      $('#file-viewer').html('<img id="image" src="data:' + responseData.type + ';base64, ' + responseData.data + '"/>');
    }
    else if (classType === 'audio') {
      $('#file-viewer').html('<audio controls><source src="data:' + responseData.type + ';base64, ' + responseData.data + '"></audio>');
    }
    else if (classType === 'video') {
      $('#file-viewer').html('<video controls><source src="data:' + responseData.type + ';base64, ' + responseData.data + '"></video>');
    }
    else {
      console.err('wrong type');
      return;
    }
  }
  $.mobile.changePage('#view-page'); 
};

var clickFile = function(filename, path) {
  $.get('/cat', {
    'filename': path + '/' + filename
  }, 
  function(data) {
    data = JSON.parse(data);
    loadFile(data);
  });
};

var clickDir = function(dirname, path) {
  $.get('/ls', {
    path: path + '/' + dirname
  }, 
  function(data) {
    loadList(data);
    refreshList();
  });
  
};

// Initialize 
$scope.currentPath = '';
$.get('/ls', {
    path: '/'
  },
  function(data) {
    loadList(data);
    refreshList();
  }
);

