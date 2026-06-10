angular.module("hospitalApp").controller("LoginController", ["$scope", "httpService", function ($scope, httpService) {
    $scope.email = "";
    $scope.password = "";
    $scope.login = () => {
        httpService.login($scope.email, $scope.password).then(function (response) {
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
        }).catch(function (error) {
            console.log(error);
        })
    }
}])