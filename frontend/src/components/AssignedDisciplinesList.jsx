import { useContext, useState } from "react";
import api from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";
import EditDisciplineModal from "./EditDisciplineModal";

export default function AssignedDisciplinesList({ disciplines, competitionId, onClose, onChange }) {
    const { user } = useContext(AuthContext);
    const [editing, setEditing] = useState(null);

    const canEdit =
        user?.roles?.includes("admin") ||
        user?.roles?.includes("organizator");

    async function remove(discipline_id) {
        if (!confirm("Opravdu odebrat disciplínu ze soutěže?")) return;

        try {
            await api.post("/disciplines/unassign", {
                competition_id: competitionId,
                discipline_id
            });
            onChange();
        } catch (err) {
            const code = err.response?.data?.code;

            if (code === "DISCIPLINE_IN_USE") {
                alert("Disciplínu nelze odebrat – existují přihlášky.");
            } else if (code === "COMPETITION_STARTED") {
                alert("Po začátku soutěže nelze disciplíny měnit.");
            } else {
                alert("Nelze odebrat disciplínu.");
            }
        }
    }

    return (
        <div className="discipline-list" onClose={onClose}>
            {disciplines.map(d => (
                <div key={d.discipline_id} className="discipline-row">
                    <div>
                        <strong>{d.name}</strong>
                        <div className="muted">
                            {d.type} • {d.is_team ? `Týmová (${d.pocet_athletes})` : "Individuální"}
                        </div>
                        <div className="chips">
                            {d.age_categories.map(a => (
                                <span key={a} className="chip">{a}</span>
                            ))}
                        </div>
                    </div>

                    {canEdit && (
                        <div className="row-actions">
                            <button
                                className="btn-outline"
                                onClick={() => {
                                    if (d.locked) {
                                        alert("Disciplínu nelze upravit – existují přihlášky");
                                        return;
                                    }
                                    setEditing(d);
                                }}
                            >
                                ✏️
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    if (d.locked) {
                                        alert("Disciplínu nelze odebrat – existují přihlášky");
                                        return;
                                    }
                                    remove(d.discipline_id);
                                }}
                            >
                                🗑
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {editing && (
                <EditDisciplineModal
                    discipline={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        onChange();
                    }}
                />
            )}
        </div>
    );
}
