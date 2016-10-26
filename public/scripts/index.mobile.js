'use strict';
/* global $ */
var Viewer = {};
Viewer.currentPageCount = 0;
Viewer.dialogAtPageID = undefined;

// if (sessionStorage.getItem('login') !== 'true') {
//   window.location = "login.html";
// }

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

var beautyDate = function(date) {
  return date.toISOString().substr(0, 10);
};

var trimString = function(str, length) {
  if (length === undefined) length = 20;
  if (str.length < length) return str;
  else return str.substr(0, length - 3) + '...';
};

Viewer.constructListNode = function(file) {
  var liNode = $('<li></li>');
  var iconWrapper = $('<div class="list-item-icon-wrapper"></div>');
  iconWrapper.appendTo(liNode);
  var innerWrapper = $('<div class="list-item-inner-wrapper"></div>');
  innerWrapper.appendTo(liNode);
  if (file.type === 'dir') {
    iconWrapper.append('<span class="ui-icon-my-dir"></span>');
  }
  else {
    iconWrapper.append('<span class="ui-icon-my-file"></span>');
  }
  innerWrapper.append('<div><span class="list-item-file-name">' + file.filename + '</span><span class="list-item-last-date">' + beautyDate(file.last_date) + '</span></div>');
  innerWrapper.append('<div><span class="list-item-author-name">' + file.author_name + '</span><span class="list-item-message">' + trimString(file.message, 30) + '</span></div>');
  liNode.data('filename', file.filename);
  liNode.data('path', file.path);
  liNode.data('type', file.type);
  return liNode;
};

Viewer.constructListPage = function(list, dirname) {
  // data objects
  var filelist = list;
  var file;
  for (file of filelist) {
    file.last_date = new Date(file.last_date);
  }
  filelist.sort(function(a, b) {
    if (a.type === 'dir' && b.type === 'file') return -1;
    if (b.type === 'dir' && a.type === 'file') return 1;
    if (a.filename > b.filename) return 1;
    if (a.filename < b.filename) return -1;
    return 0;
  });
  console.log(filelist);

  // add contents
  var pageNode = $('#list-page-template').clone();
  $('#view-page').before(pageNode);
  var ulNode = pageNode.find('ul.list-container');
  ulNode.empty();
  var liNode;
  for (file of filelist) {
    liNode = Viewer.constructListNode(file);
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

  // clicking create: clear filename input
  $('.nav-create-button').click(function() {
    $('#file-name').val('');
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

  // remember dirname
  pageNode.data('dirname', dirname);
};

Viewer.refreshDirPage = function(pageID) {
  var pageNode = $('#' + pageID);
  var dirname = pageNode.data('dirname');

  $.get('/ls', {
    path: dirname
  }, 
  function(list) {
    // data objects
    var filelist = list;
    var file;
    for (file of filelist) {
      file.last_date = new Date(file.last_date);
    }
    filelist.sort(function(a, b) {
      if (a.type === 'dir' && b.type === 'file') return -1;
      if (b.type === 'dir' && a.type === 'file') return 1;
      if (a.filename > b.filename) return 1;
      if (a.filename < b.filename) return -1;
      return 0;
    });
    console.log(filelist);

    // add contents
    var ulNode = pageNode.find('ul.list-container');
    ulNode.empty();
    var liNode;
    for (file of filelist) {
      liNode = Viewer.constructListNode(file);
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

    ulNode.listview('refresh');
    $.mobile.changePage('#' + pageID);
  });
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
  $.get('/git_pull', function(data) {
    if (data.succses) {
      console.log(data.update);
      $.mobile.changePage('#' + Viewer.dialogAtPageID);
      setTimeout(function() {
        $.mobile.activePage.find('.popupBasic').find('.popup-content').text('Pulled');
        $.mobile.activePage.find('.popupBasic').popup('open'); 
      }, 1000);
    }
    else {
      console.log(data.err);
    }
  });
});

$('#commit-button').click(function() {
  console.log('commit');
  $.get('/git_commit', {
      message: sessionStorage.getItem('username') + ' commit in web, ' + Date()
    }, 
    function(data) {
      if (data.success) {
        console.log(data.info);
        $.mobile.changePage('#' + Viewer.dialogAtPageID);
        setTimeout(function() {
          $.mobile.activePage.find('.popupBasic').find('.popup-content').text('Committed');
          $.mobile.activePage.find('.popupBasic').popup('open'); 
        }, 1000);
      }
      else {
        console.log(data.err);
      }
    });
});

$('#push-button').click(function() {
  console.log('push');
  $.get('/git_push', function(data) {
    if (data.success) {
      console.log(data.info);
      $.mobile.changePage('#' + Viewer.dialogAtPageID);
      setTimeout(function() {
        $.mobile.activePage.find('.popupBasic').find('.popup-content').text('Pushed');
        $.mobile.activePage.find('.popupBasic').popup('open'); 
      }, 1000);
    }
    else {
      console.log(data.err);
    }
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
        $('#file-viewer').data('content', $('#edit-viewer').find('textarea').val());
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

// create with new file name  
$('#create-button').click(function() {
  $.ajax({
    method: 'POST',
    url: '/write', 
    dataType: 'json', 
    data: {
      filename: Viewer.removeDuplicateSlash($('#'+Viewer.dialogAtPageID).data('dirname') + '/' + $('#file-name').val()),
      content: ''
    }, 
    success: function(data) {
      if (data.success) {
        Viewer.refreshDirPage(Viewer.dialogAtPageID);
      }
      else {
        console.log('error to create file');
      }
    }
  });
});

