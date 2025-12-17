import React from "react";

export default function AthleteCard({
                                        athlete,
                                        onEdit,
                                        onDelete,
                                        readOnly = false
                                    }) {
    return (
        <div className="athlete-card">
            <div>
                <strong>{athlete.first_name} {athlete.last_name}</strong>
                <div className="athlete-meta">
                    Rok narození: {athlete.birth_year} |
                    Pohlaví: {athlete.gender}
                </div>
            </div>

            {!readOnly && (
                <div className="athlete-actions">
                    <button
                        className="btn-outline"
                        onClick={() => onEdit(athlete)}
                    >
                        ✏️ Upravit
                    </button>

                    <button
                        className="btn-danger"
                        onClick={() => onDelete(athlete)}
                    >
                        🗑️ Smazat
                    </button>
                </div>
            )}
        </div>
    );
}
