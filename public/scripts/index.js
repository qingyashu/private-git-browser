'use strict';
/* global angular, $ */

// TODO: check login

var app = angular.module('listApp', []);

app.controller('listCtrl', function($scope, $http) {
  $http({
    method: 'GET',
    url: '/ls',
    params: {
      path: '/'
    }
  })
  .then(function(response) {
    $scope.filelist = [];
    for (var file of response.data) {
      $scope.filelist.push({
        filename: file.filename, 
        path: file.path,
        type: file.type,
        children: []
      });
    }
    console.log($scope.filelist);
  });

  $scope.clickFile = function(fileObj, eventObj) {
    console.log(fileObj);
    if (fileObj.type === 'dir') {
      if (fileObj.expanded === true) { // need collapse 
        fileObj.children = [];
        fileObj.expanded = false;
      }
      else { // need expand
        $http({
          method: 'GET',
          url: '/ls',
          params: {
            path: fileObj.path + '/' + fileObj.filename
          }
        })
        .then(function(response) {
          console.log(response.data);
          fileObj.children = [];
          for (var file of response.data) {
            fileObj.children.push({
              filename: file.filename, 
              path: file.path, 
              type: file.type,
              children: []
            });
          }
          fileObj.expanded = true;
          console.log(fileObj);
        });
      }
        
    }
    else {
      $http({
        method: 'GET',
        url: '/cat',
        params: {
          'filename': fileObj.path + '/' + fileObj.filename
        }
      })
      .then(function(response) {
        var responseData = response.data;
        if (responseData.mediaType === false) { // text
          $('#file-viewer').html(responseData.data);
        }
        else {
          var classType = responseData.type.split('/')[0];
          if (classType === 'image') {
            $('#file-viewer').html('<img id="image" src="data:' + responseData.type + ';base64, ' + response.data.data + '"/>');
          }
          else if (classType === 'audio') {
            $('#file-viewer').html('<audio controls><source src="data:' + responseData.type + ';base64, ' + response.data.data + '"></audio>');
          }
          else if (classType === 'video') {
            $('#file-viewer').html('<video controls><source src="data:' + responseData.type + ';base64, ' + response.data.data + '"></video>');
          }
          else {
            console.err('wrong type');
            return;
          }
        }
        
      });
    }
    eventObj.stopPropagation();
  };
});