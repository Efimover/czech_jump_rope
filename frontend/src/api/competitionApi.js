const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getCompetitions() {
    const res = await fetch(`${API_URL}/competitions`);
    return res.json();
}

export async function getCompetition(id) {
    const res = await fetch(`${API_URL}/competitions/${id}`);
    return res.json();
}
export async function getCompetitionDisciplines(competitionId) {
    const res = await fetch(`${API_URL}/disciplines/competition/${competitionId}`);
    return res.json();
}
