angular.module("hospitalApp").controller("HomeController", ["$scope", "httpService", "$location", function ($scope, httpService, $location) {
    $scope.token = localStorage.getItem("token");
    if (!$scope.token) {
        $location.path("/login");
    }
    $scope.logout = function () {
        console.log("Logout");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        $location.path("/login");
    }
    $scope.makeAppointment = function () {
        $location.path("/appointment");
    }
}])