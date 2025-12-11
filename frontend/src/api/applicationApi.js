import api from "./apiClient";

export async function createRegistration(competition_id) {
    const res = await api.post("/registrations", { competition_id });
    return res.data;
}

export async function getRegistration(id) {
    const res = await api.get(`/registrations/${id}`);
    return res.data;
}