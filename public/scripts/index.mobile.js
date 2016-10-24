'use strict';
/* global angular, $ */

if (sessionStorage.getItem('login') !== 'true') {
  window.location = "login.html";
}

var app = angular.module('listApp', []);

app.controller('listCtrl', function($scope, $http) {
  $scope.currentPath = '';
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
        type: file.type
      });
    }
    console.log($scope.filelist);
  });

  $scope.clickFile = function(fileObj, eventObj) {
    console.log(fileObj);
    if (fileObj.type === 'dir') {
      $http({
        method: 'GET',
        url: '/ls',
        params: {
          path: fileObj.path + '/' + fileObj.filename
        }
      })
      .then(function(response) {
        $scope.currentPath = $scope.currentPath + '/' + fileObj.filename;
        console.log(response.data);
        $scope.filelist = [];
        for (var file of response.data) {
          $scope.filelist.push({
            filename: file.filename, 
            path: file.path, 
            type: file.type
          });
        }

      });
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