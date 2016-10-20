'use strict';
/* global angular */

var app = angular.module('loginApp', []);

app.controller('loginCtrl', function($scope, $http) {
  $scope.login = function() {
    console.log($scope.name, $scope.pswd, $scope.remember);
    $http({
      method: 'GET',
      url: '/login',
      params: {
        'name': $scope.name,
        'pswd': $scope.pswd
      }
    })
    .then(function(response) {
      $scope.success = response.data;
      if ($scope.success) {
        window.location = "index.html";
        return;
      }
      else {
        
      }
    });
  };
});