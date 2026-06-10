angular.module("hospitalApp").controller("RegisterController", ["$scope", "httpService", "$location", function ($scope, httpService, $location) {
    $scope.name = "";
    $scope.email = "";
    $scope.password = "";
    $scope.phone = "";
    $scope.address = "";
    $scope.city = "";
    $scope.state = "";
    $scope.zip_code = "";
    $scope.country = "";
    $scope.errorMessage = "";

    $scope.register = function () {
        $scope.errorMessage = ""; // Reset error message

        httpService.register(
            $scope.name,
            $scope.email,
            $scope.password,
            $scope.phone,
            $scope.address,
            $scope.city,
            $scope.state,
            $scope.zip_code,
            $scope.country
        ).then(function (response) {
            console.log(response);
            alert("Registration successful! Please log in.");
            $location.path("/login");
        }).catch(function (error) {
            console.log(error);
            // Assign error details to display in the UI alert block
            $scope.errorMessage = (error.data && error.data.error) || "Registration failed. Please check your inputs.";
        });
    };
}]);