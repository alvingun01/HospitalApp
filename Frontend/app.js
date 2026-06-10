app = angular.module("hospitalApp", ["ngRoute"])

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "views/home.html",
            controller: "HomeController"
        })
        .when("/login", {
            templateUrl: "views/login.html",
            controller: "LoginController"
        })
        .when("/register", {
            templateUrl: "views/register.html",
            controller: "RegisterController"
        })
        .when("/doctors", {
            templateUrl: "views/doctors.html"
        })
        .when("/patients", {
            templateUrl: "views/patients.html"
        })
        .when("/appointments", {
            templateUrl: "views/appointments.html"
        })
        .otherwise({
            redirectTo: "/"
        })
})

app.run(["$rootScope", "$location", function ($rootScope, $location) {
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        const token = localStorage.getItem("token");
        const isPublicRoute = next && (next.templateUrl === "views/login.html" || next.templateUrl === "views/register.html");

        if (!token && !isPublicRoute) {
            $location.path("/login");
        }
    });
}]);