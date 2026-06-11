angular.module("hospitalApp").controller("HomeController", ["$scope", "httpService", "$location", function ($scope, httpService, $location) {
    $scope.token = localStorage.getItem("token");
    $scope.currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if ($scope.currentUser.role !== 'patient') {
        $location.path('/doctorHome');
    }

    if (!$scope.token) {
        $location.path("/login");
        return;
    }

    $scope.upcomingAppointments = [];
    $scope.completedAppointments = [];
    $scope.doctorsMap = {};

    $scope.logout = function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        $location.path("/login");
    };

    $scope.makeAppointment = function () {
        $location.path("/appointment");
    };

    $scope.loadDashboardData = function () {
        // 1. Fetch doctors first for easy lookup mapping
        httpService.getDoctors().then(function (docResponse) {
            docResponse.data.forEach(doc => {
                const docName = doc.user ? `Dr. ${doc.user.first_name} ${doc.user.last_name}` : "Doctor";
                $scope.doctorsMap[doc.id] = `${docName} (${doc.specialization})`;
            });

            // 2. Fetch patient profile belonging to current user
            return httpService.getPatients();
        }).then(function (response) {
            if (!response) return;
            const currentPatient = response.data.find(p => p.user && p.user.id === $scope.currentUser.id);
            if (!currentPatient) return;

            // 3. Fetch appointments and filter by current patient
            return httpService.getAppointmentsByPatientId(currentPatient.id).then(function (appResponse) {
                const now = new Date();
                const patientApps = appResponse.data;

                // Map doctor name string onto the appointment object
                patientApps.forEach(app => {
                    app.doctorName = $scope.doctorsMap[app.doctor] || "Unknown Doctor";
                });
                console.log(patientApps);
                // Partition appointments into upcoming and completed
                $scope.upcomingAppointments = patientApps
                    .filter(app => new Date(app.appointment_date) >= now && app.appointment_status !== 'Completed' && app.appointment_status !== 'Cancelled')
                    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

                $scope.completedAppointments = patientApps
                    .filter(app => new Date(app.appointment_date) < now || app.appointment_status === 'Completed' || app.appointment_status === 'Cancelled')
                    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

            });
        }).catch(function (error) {
            console.error("Error loading dashboard data:", error);
        });
    };

    $scope.loadDashboardData();
}]);