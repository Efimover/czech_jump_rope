import api from "./apiClient";

export function addAthlete(registration_id, athlete) {
    return api.post(`/registrations/${registration_id}/athletes`, athlete);
}
