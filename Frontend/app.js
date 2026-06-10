app = angular.module("hospitalApp", ["ngRoute"])

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "views/home.html"
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