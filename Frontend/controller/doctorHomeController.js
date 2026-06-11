angular.module("hospitalApp").controller("doctorHomeController", ["$scope", "httpService", "$location", function ($scope, httpService, $location) {
    $scope.appointments = [];
    $scope.currentDoctor = JSON.parse(localStorage.getItem('user') || '{}');
    if ($scope.currentDoctor.role !== 'doctor') {
        $location.path('/');
    }
    $scope.patientsMap = {};
    $scope.completedAppointments = [];
    $scope.upcomingAppointments = [];

    $scope.logout = function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        $location.path("/login");
    };

    // 1. Fetch patient list to map IDs to detailed patient profiles
    httpService.getPatients().then(function (patientsResponse) {
        patientsResponse.data.forEach(patient => {
            if (patient.user) {
                $scope.patientsMap[patient.id] = {
                    name: `${patient.user.first_name} ${patient.user.last_name}`,
                    phone: patient.phone || 'N/A',
                    email: patient.user.email || 'N/A',
                    location: (patient.city && patient.state) ? `${patient.city}, ${patient.state}` : (patient.city || patient.state || 'N/A')
                };
            } else {
                $scope.patientsMap[patient.id] = {
                    name: "Patient",
                    phone: 'N/A',
                    email: 'N/A',
                    location: 'N/A'
                };
            }
        });

        // 2. Fetch appointments (automatically isolated for this doctor by the backend)
        return httpService.getAppointmentsByDoctorId();
    }).then(function (appointmentsResponse) {
        if (!appointmentsResponse) return;

        const now = new Date();
        const doctorApps = appointmentsResponse.data;

        // Map detailed patient object onto the appointment object
        doctorApps.forEach(app => {
            app.patientDetails = $scope.patientsMap[app.patient] || { name: "Unknown Patient", phone: 'N/A', email: 'N/A', location: 'N/A' };
            app.appointment_date_formatted = new Date(app.appointment_date).toLocaleString();
        });

        // Filter for upcoming appointments and sort chronologically
        console.log(doctorApps);
        $scope.upcomingAppointments = doctorApps
            .filter(app => new Date(app.appointment_date) >= now && app.appointment_status !== 'Completed' && app.appointment_status !== 'Cancelled')
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        $scope.completedAppointments = doctorApps
            .filter(app => new Date(app.appointment_date) < now || app.appointment_status === 'Completed' || app.appointment_status === 'Cancelled')
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    }).catch(function (error) {
        console.error("Error loading doctor dashboard:", error);
    });
}]);