'use strict';
/* global $ */
var Viewer = {};
Viewer.currentPageCount = 0;

if (sessionStorage.getItem('login') !== 'true') {
  window.location = "login.html";
}

Viewer.removeDuplicateSlash = function(str) {
  return str.replace(/\/+/g, '/');
};

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
    var dirTitle = Viewer.removeDuplicateSlash(path + '/' + dirname);
    Viewer.constructListPage(data, dirTitle);
  });
};

Viewer.constructListPage = function(list, dirname) {
  // data objects
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

  // add contents
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
  
  // bind clicking events
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

  // back button
  // var activePageID = Number($.mobile.activePage.attr('id'));
  var backButton = $('<a data-rel="back" class="ui-btn ui-btn-left ui-alt-icon ui-nodisc-icon ui-corner-all ui-btn-icon-notext ui-icon-carat-l">Back</a>');
  pageNode.find('.header').append(backButton);

  // title of the new page
  pageNode.find('h1.path-container').text(dirname);

  // construct new page ID 
  pageNode.attr('id', Viewer.currentPageCount);
  $.mobile.changePage('#' + pageNode.attr('id')); 
  Viewer.currentPageCount ++;

};

Viewer.loadFile = function(responseData) {
  // load file content 
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

  // display title 
  $('#view-page').find('#file-title').text(Viewer.removeDuplicateSlash(responseData.filename));

  // change to page 
  $.mobile.changePage('#view-page'); 
};

// Initialize 
$.get('/ls', {
    path: '/'
  },
  function(data) {
    Viewer.constructListPage(data, '/');
  }
);