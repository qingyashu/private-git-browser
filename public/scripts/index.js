'use strict';
/* global angular */

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

  $scope.openFile = function(filename) {
    console.log(filename);
    $http({
      method: 'GET',
      url: '/cat',
      params: {
        'filename': filename
      }
    })
    .then(function(response) {
      $scope.fileContent = response.data;
      console.log($scope.fileContent);
    });
  };
});