angular.module("hospitalApp").controller("AppointmentController", ["$scope", "httpService", "$location", function ($scope, httpService, $location) {
    $scope.token = localStorage.getItem("token");
    $scope.currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (!$scope.token) {
        $location.path("/login");
        return;
    }

    $scope.doctors = [];
    $scope.appointment = {
        doctorId: "",
        appointmentDate: "",
        appointmentTime: ""
    };
    $scope.errorMessage = "";
    $scope.successMessage = "";

    // Load list of doctors
    $scope.loadDoctors = function () {
        httpService.getDoctors().then(function (response) {
            $scope.doctors = response.data;
        }).catch(function (error) {
            console.error("Error loading doctors:", error);
            $scope.errorMessage = "Failed to load doctors list.";
        });
    };

    $scope.loadDoctors();

    $scope.logout = function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        $location.path("/login");
    };

    $scope.submitAppointment = function () {
        $scope.errorMessage = "";
        $scope.successMessage = "";

        if (!$scope.appointment.doctorId || !$scope.appointment.appointmentDate || !$scope.appointment.appointmentTime) {
            $scope.errorMessage = "Please fill in all fields.";
            return;
        }

        // We need the current patient profile ID to book an appointment.
        // First, fetch the patients list and find the profile belonging to the current user.
        httpService.getPatients().then(function (response) {
            const patients = response.data;
            const currentPatient = patients.find(p => p.user && p.user.id === $scope.currentUser.id);

            if (!currentPatient) {
                $scope.errorMessage = "Could not find a patient profile for your account.";
                return;
            }

            // Combine Date and Time
            const dateObj = new Date($scope.appointment.appointmentDate);
            
            let hours = 0;
            let minutes = 0;
            
            if ($scope.appointment.appointmentTime instanceof Date) {
                hours = $scope.appointment.appointmentTime.getHours();
                minutes = $scope.appointment.appointmentTime.getMinutes();
            } else if (typeof $scope.appointment.appointmentTime === "string") {
                const timeParts = $scope.appointment.appointmentTime.split(":");
                hours = parseInt(timeParts[0], 10) || 0;
                minutes = parseInt(timeParts[1], 10) || 0;
            }
            
            dateObj.setHours(hours);
            dateObj.setMinutes(minutes);
            dateObj.setSeconds(0);

            // Construct payload matching AppointmentSerializer
            const payload = {
                patient: currentPatient.id,
                doctor: parseInt($scope.appointment.doctorId, 10),
                appointment_date: dateObj.toISOString()
            };

            return httpService.postAppointments(payload);
        }).then(function (response) {
            if (response) { // check if nested request succeeded
                $scope.successMessage = "Appointment booked successfully!";
                $scope.appointment = {
                    doctorId: "",
                    appointmentDate: "",
                    appointmentTime: ""
                };
            }
        }).catch(function (error) {
            console.error("Error booking appointment:", error);
            $scope.errorMessage = error.data && error.data.error ? error.data.error : "Failed to book appointment. Please try again.";
        });
    };
}]);