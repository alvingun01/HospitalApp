angular.module("hospitalApp").controller("appointmentDetailsController", ["$scope", "httpService", "$location", "$routeParams", function ($scope, httpService, $location, $routeParams) {
    $scope.appointmentId = $routeParams.appointmentId;
    $scope.appointment = null;
    $scope.formData = {
        diagnosisInput: ""
    };
    $scope.loading = true;
    $scope.error = "";
    $scope.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    $scope.userRole = $scope.currentUser.role || localStorage.getItem('userRole'); // 'patient' or 'doctor'

    // Check if user is logged in
    if (!localStorage.getItem("token")) {
        $location.path("/login");
        return;
    }

    // 1. Fetch detailed appointment data
    httpService.getAppointment($scope.appointmentId).then(function (response) {
        $scope.appointment = response.data;
        $scope.formData.diagnosisInput = response.data.diagnosis || "";

        // 2. Fetch patient details
        httpService.getPatient(response.data.patient).then(function (patientResponse) {
            $scope.appointment.patientDetails = patientResponse.data;

            // 3. Fetch doctor details
            httpService.getDoctor(response.data.doctor).then(function (doctorResponse) {
                $scope.appointment.doctorDetails = doctorResponse.data;
                $scope.loading = false;
            }).catch(function (err) {
                $scope.error = "Failed to load doctor details.";
                $scope.loading = false;
            });

            $scope.loading = false;
        }).catch(function (err) {
            $scope.error = "Failed to load patient details.";
            $scope.loading = false;
        });

    }).catch(function (err) {
        $scope.error = "Failed to load appointment details.";
        $scope.loading = false;
    });

    // Format appointment time for display
    $scope.getAppointmentTime = function () {
        if ($scope.appointment) {
            return new Date($scope.appointment.appointment_date).toLocaleString();
        }
        return "";
    };

    // Format Date
    $scope.getAppointmentDate = function () {
        if ($scope.appointment) {
            return new Date($scope.appointment.appointment_date).toLocaleDateString();
        }
        return "";
    };

    $scope.getStatusClass = function () {
        if (!$scope.appointment) return "";
        const status = $scope.appointment.appointment_status;
        if (status === "Completed") return "status-success";
        if (status === "Cancelled") return "status-danger";
        return "status-warning"; // Pending
    };

    $scope.cancelAppointment = function () {
        if (confirm("Are you sure you want to cancel this appointment?")) {
            $scope.appointment.appointment_status = "Cancelled";
            const payload = {
                patient: $scope.appointment.patient,            // Patient profile ID
                doctor: $scope.appointment.doctor,              // Doctor profile ID
                appointment_date: $scope.appointment.appointment_date,
                appointment_status: $scope.appointment.appointment_status,
                diagnosis: $scope.appointment.diagnosis || "",
                total_bills: $scope.appointment.total_bills || 0.00,
                paid: $scope.appointment.paid || false
            };
            httpService.putAppointments($scope.appointmentId, payload).then(function () {
                $scope.error = "Appointment cancelled successfully.";
                // Redirect to dashboard based on role
                setTimeout(() => {
                    if ($scope.userRole === 'doctor') {
                        $location.path("/doctorHome");
                    } else {
                        $location.path("/home");
                    }
                }, 1000);
            }).catch(function (err) {
                $scope.error = "Failed to cancel appointment: " + err.data.detail;
            });
        }
    };

    $scope.completeAppointment = function () {
        if (confirm("Mark this appointment as completed?")) {
            $scope.appointment.appointment_status = "Completed";
            const payload = {
                patient: $scope.appointment.patient,
                doctor: $scope.appointment.doctor,
                appointment_date: $scope.appointment.appointment_date,
                appointment_status: $scope.appointment.appointment_status,
                diagnosis: $scope.appointment.diagnosis || "",
                total_bills: $scope.appointment.total_bills || 0.00,
                paid: $scope.appointment.paid || false
            };
            httpService.putAppointments($scope.appointmentId, payload).then(function () {
                $scope.error = "Appointment marked as completed.";
                setTimeout(() => {
                    if ($scope.userRole === 'doctor') {
                        $location.path("/doctorHome");
                    } else {
                        $location.path("/home");
                    }
                }, 1000);
            }).catch(function (err) {
                $scope.error = "Failed to complete appointment: " + (err.data && err.data.detail || "Error");
            });
        }
    };

    $scope.addDiagnosis = function () {
        if (!$scope.formData.diagnosisInput) {
            $scope.error = "Please enter a diagnosis.";
            return;
        }

        $scope.appointment.diagnosis = $scope.formData.diagnosisInput;
        const payload = {
            patient: $scope.appointment.patient,
            doctor: $scope.appointment.doctor,
            appointment_date: $scope.appointment.appointment_date,
            appointment_status: $scope.appointment.appointment_status,
            diagnosis: $scope.appointment.diagnosis || "",
            total_bills: $scope.appointment.total_bills || 0.00,
            paid: $scope.appointment.paid || false
        };

        httpService.putAppointments($scope.appointmentId, payload).then(function (response) {
            $scope.appointment.diagnosis = response.data.diagnosis;
            $scope.error = "Diagnosis added successfully.";
            $scope.formData.diagnosisInput = ""; // Clear input notes field
        }).catch(function (err) {
            $scope.error = "Failed to add diagnosis: " + (err.data && err.data.detail || "Error");
        });
    };

    $scope.logout = function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        $location.path("/login");
    };

    $scope.backToDashboard = function () {
        if ($scope.userRole === 'doctor') {
            $location.path("/doctorHome");
        } else {
            $location.path("/home");
        }
    };
}]);
