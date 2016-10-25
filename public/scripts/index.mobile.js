'use strict';
/* global $ */
var Viewer = {};
Viewer.currentPageCount = 0;
Viewer.dialogAtPageID;

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
  if (Viewer.currentPageCount > 0) {
    var activePageID = $.mobile.activePage.attr('id');
    var backButton = $('<a href="#' + activePageID + '" class="ui-btn ui-btn-left ui-alt-icon ui-nodisc-icon ui-corner-all ui-btn-icon-notext ui-icon-carat-l">Back</a>');
    pageNode.find('.header').append(backButton);
  }

  // title of the new page
  pageNode.find('h1.path-container').text(dirname);

  // click buttons in navbar
  pageNode.find('.dialog-trigger-button').click(function() {
    Viewer.dialogAtPageID = $.mobile.activePage.attr('id');
    console.log(Viewer.dialogAtPageID);
  });

  // construct new page ID 
  pageNode.attr('id', Viewer.currentPageCount);
  $.mobile.changePage('#' + pageNode.attr('id')); 
  Viewer.currentPageCount ++;
};

Viewer.loadTextFile = function(data, filename) {
  $('#file-viewer').data('content', data);
  $('#file-viewer').data('filename', filename);
  $('#file-viewer').empty();
  $('#file-viewer').html('<pre>' + data + '</pre>');
  // var lines = data.split('\n');
  // $('#file-viewer').empty();
  // for (var line of lines) {
  //   $('#file-viewer').append('<p><pre>' + line + '</pre></p>');
  // }
};

Viewer.loadFile = function(responseData) {
  // load file content 
  if (responseData.mediaType === false) { // text
    $('#view-page').find('.footer').show();
    Viewer.loadTextFile(responseData.data, Viewer.removeDuplicateSlash(responseData.filename));
  }
  else {
    $('#view-page').find('.footer').hide();
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

  // remember back page id
  var activePageID = $.mobile.activePage.attr('id');
  $('#view-page-back-button').attr('href', '#' + activePageID);

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

$('#pull-button').click(function() {
  console.log('pull');
  $.get('/git_pull', function(data, states) {
    $.mobile.changePage('#' + Viewer.dialogAtPageID);
    setTimeout(function() {
      $.mobile.activePage.find('.popupBasic').find('.popup-content').text('Pulled');
      $.mobile.activePage.find('.popupBasic').popup('open'); 
    }, 1000);
  });
});

$('#commit-button').click(function() {
  console.log('commit');
  $.get('/git_commit', {
      message: sessionStorage.getItem('username') + ' commit in web, ' + Date()
    }, 
    function(data, states) {
      $.mobile.changePage('#' + Viewer.dialogAtPageID);
      setTimeout(function() {
        $.mobile.activePage.find('.popupBasic').find('.popup-content').text('Committed');
        $.mobile.activePage.find('.popupBasic').popup('open'); 
      }, 1000);
    });
});

$('#push-button').click(function() {
  console.log('push');
  $.get('/git_push', function(data, states) {
    $.mobile.changePage('#' + Viewer.dialogAtPageID);
    setTimeout(function() {
      $.mobile.activePage.find('.popupBasic').find('.popup-content').text('Pushed');
      $.mobile.activePage.find('.popupBasic').popup('open'); 
    }, 1000);
  });
});

// jump to editing page
$('#edit-button').click(function() {
  $('#edit-page').find('textarea').val($('#file-viewer').data('content'));
  $('#edit-page').find('#edit-file-title').html($('#file-viewer').data('filename'));
  $.mobile.changePage('#edit-page');
  var width = $(window).width() - 30;
  $('#edit-viewer').find('textarea').css('width', width);
});

// save edit result 
$('#save-button').click(function() {
  $.ajax({
    method: 'POST',
    url: '/write', 
    dataType: 'json', 
    data: {
      filename: $('#file-viewer').data('filename'),
      content: $('#edit-viewer').find('textarea').val()
    }, 
    success: function(data) {
      // back to view page 
      $.mobile.changePage('#view-page');
      if (data.success) {
        $('#file-viewer').html('<pre>' + $('#edit-viewer').find('textarea').val() + '</pre>');
        setTimeout(function() {
          $.mobile.activePage.find('.popupBasic').find('.popup-content').text('Success!');
          $.mobile.activePage.find('.popupBasic').popup('open'); 
        }, 1000);
      }
    }
  });
});

// $('.dialog-trigger-button').click(function() {
//   Viewer.dialogAtPageID = $.mobile.activePage.attr('id');
//   console.log(Viewer.dialogAtPageID);
// });