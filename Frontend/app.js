app = angular.module("hospitalApp", ["ngRoute"])

app.factory("authInterceptor", ["$q", "$location", function ($q, $location) {
    return {
        request: function (config) {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers['Authorization'] = 'Token ' + token;
            }
            return config;
        },
        responseError: function (rejection) {
            if (rejection.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                $location.path("/login");
            }
            return $q.reject(rejection);
        }
    };
}]);

app.config(["$routeProvider", "$httpProvider", function ($routeProvider, $httpProvider) {
    $httpProvider.interceptors.push("authInterceptor");

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
        .when("/doctorHome", {
            templateUrl: "views/doctorHome.html",
            controller: "doctorHomeController"
        })
        .when("/doctors", {
            templateUrl: "views/doctors.html"
        })
        .when("/patients", {
            templateUrl: "views/patients.html"
        })
        .when("/appointment", {
            templateUrl: "views/appointment.html",
            controller: "AppointmentController"
        })
        .when("/appointmentDetails/:appointmentId", {
            templateUrl: "views/appointmentDetails.html",
            controller: "appointmentDetailsController"
        })
        .otherwise({
            redirectTo: "/"
        })
}])

app.run(["$rootScope", "$location", function ($rootScope, $location) {
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        const token = localStorage.getItem("token");
        const isPublicRoute = next && (next.templateUrl === "views/login.html" || next.templateUrl === "views/register.html");

        if (!token && !isPublicRoute) {
            $location.path("/login");
        }
    });
}]);