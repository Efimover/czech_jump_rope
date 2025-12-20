import React from "react";

export default function AssignedDisciplinesList({ disciplines }) {
    if (!disciplines || disciplines.length === 0) {
        return <p className="placeholder">Zatím nebyly přidány žádné disciplíny.</p>;
    }

    return (
        <div className="assigned-disciplines">
            {disciplines.map(d => (
                <div key={d.discipline_id} className="discipline-row">
                    <div>
                        <strong>{d.name}</strong>{" "}
                        <span className="discipline-type">({d.type})</span>
                    </div>

                    <div className="discipline-meta">
                        {d.is_team ? (
                            <span>👥 Týmová ({d.pocet_athletes} členů)</span>
                        ) : (
                            <span>👤 Individuální</span>
                        )}
                    </div>

                    <div className="discipline-ages">
                        {d.age_categories?.length > 0 ? (
                            d.age_categories.map((ac, i) => (
                                <span key={i} className="age-chip">
                                    {ac}
                                </span>
                            ))
                        ) : (
                            <span className="empty">Bez věkové kategorie</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
