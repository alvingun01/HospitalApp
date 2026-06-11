angular.module("hospitalApp").factory("httpService", ["$http", function ($http) {

    const BASE_URL = "http://localhost:8000/api"
    return {
        login(email, password) {
            return $http.post(`${BASE_URL}/auth/login/`, { email, password })
        },
        register(name, email, password, phone, address, city, state, zip_code, country) {
            return $http.post(`${BASE_URL}/auth/register/`, { name, email, password, phone, address, city, state, zip_code, country })
        },
        getDoctors() {
            return $http.get(`${BASE_URL}/doctors/`)
        },
        getPatients() {
            return $http.get(`${BASE_URL}/patients/`)
        },
        getAppointments() {
            return $http.get(`${BASE_URL}/appointments/`)
        },
        getAppointmentsByPatientId(patientId) {
            return $http.get(`${BASE_URL}/appointments/?patient=${patientId}`)
        },
        getAppointmentsByDoctorId(doctorId) {
            return $http.get(`${BASE_URL}/appointments/?doctor=${doctorId}`)
        },
        postDoctors(data) {
            return $http.post(`${BASE_URL}/doctors/`, data)
        },
        postPatients(data) {
            return $http.post(`${BASE_URL}/patients/`, data)
        },
        postAppointments(data) {
            return $http.post(`${BASE_URL}/appointments/`, data)
        },
        putDoctors(id, data) {
            return $http.put(`${BASE_URL}/doctors/${id}/`, data)
        },
        putPatients(id, data) {
            return $http.put(`${BASE_URL}/patients/${id}/`, data)
        },
        putAppointments(id, data) {
            return $http.put(`${BASE_URL}/appointments/${id}/`, data)
        },
        deleteDoctors(id) {
            return $http.delete(`${BASE_URL}/doctors/${id}/`)
        },
        deletePatients(id) {
            return $http.delete(`${BASE_URL}/patients/${id}/`)
        },
        deleteAppointments(id) {
            return $http.delete(`${BASE_URL}/appointments/${id}/`)
        }
    }
}])