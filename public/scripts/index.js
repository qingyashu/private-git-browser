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
    $scope.filelist = response.data;
  });

  $scope.clickFile = function(fileObj) {
    if (fileObj.type === 'dir') {
      $http({
        method: 'GET',
        url: '/ls',
        params: {
          path: fileObj.filename
        }
      })
      .then(function(response) {
        // TODO　toggle directories 
      });
    }
    else {
      $http({
        method: 'GET',
        url: '/cat',
        params: {
          'filename': fileObj.filename
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
  };
});