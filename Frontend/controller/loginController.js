angular.module("hospitalApp").controller("LoginController", ["$scope", "httpService", "$location", function ($scope, httpService, $location) {
    $scope.email = "";
    $scope.password = "";
    $scope.errorMessage = "";

    $scope.login = () => {
        $scope.errorMessage = ""; // Reset error message

        httpService.login($scope.email, $scope.password).then(function (response) {
            // Save token and user details to localStorage
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            // Redirect to the home dashboard
            $location.path("/");
        }).catch(function (error) {
            console.log(error);
            // Save validation error message to display in UI
            $scope.errorMessage = (error.data && error.data.error) || "Invalid email or password. Please try again.";
            alert($scope.errorMessage);
        });
    };
}]);