'use strict';
/* global $ */
var Viewer = {};
Viewer.currentPageCount = 0;

if (sessionStorage.getItem('login') !== 'true') {
  window.location = "login.html";
}

Viewer.clickFile = function(filename, path) {
  $.get('/cat', {
    'filename': path + '/' + filename
  }, 
  function(data) {
    data = JSON.parse(data);
    Viewer.loadFile(data);
  });
};

Viewer.clickDir = function(dirname, path) {
  $.get('/ls', {
    path: path + '/' + dirname
  }, 
  function(data) {
    Viewer.constructListPage(data);
  });
};

Viewer.constructListPage = function(list) {
  var filelist = [];
  var file;
  list.sort(function(a, b) {
    return a.type > b.type;
  });
  for (file of list) {
    filelist.push({
      filename: file.filename, 
      path: file.path,
      type: file.type
    });
  }
  
  console.log(filelist);

  var pageNode = $('#list-page-template').clone();
  $('#view-page').before(pageNode);

  var ulNode = pageNode.find('ul.list-container');
  ulNode.empty();

  var liNode;
  for (file of filelist) {
    liNode = $('<li></li>');
    if (file.type === 'dir') liNode.append('<a href="#">' + file.filename + '</a>');
    else liNode.append(file.filename);
    liNode.data('filename', file.filename);
    liNode.data('path', file.path);
    liNode.data('type', file.type);
    ulNode.append(liNode);
  }
  
  ulNode.find('li').on('click', function() {
    var filename = $(this).data('filename');
    var path = $(this).data('path');
    var type = $(this).data('type');
    console.log('clicking on ', filename, path, type);
    if (type === 'dir') {
      Viewer.clickDir(filename, path);
    }
    else {
      Viewer.clickFile(filename, path);
    }
  });

  pageNode.attr('id', Viewer.currentPageCount);
  $.mobile.changePage('#' + pageNode.attr('id')); 
  Viewer.currentPageCount ++;
};

Viewer.loadFile = function(responseData) {
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

// Initialize 
$.get('/ls', {
    path: '/'
  },
  function(data) {
    Viewer.constructListPage(data);
  }
);

