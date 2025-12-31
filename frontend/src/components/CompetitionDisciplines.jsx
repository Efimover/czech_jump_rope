import {useContext, useEffect, useState} from "react";
import AssignedDisciplinesList from "./AssignedDisciplinesList";
import AddExistingDisciplineModal from "./AddExistingDisciplineModal";
import CreateDisciplineModal from "./CreateDisciplineModal";
import api from "../api/apiClient.js";
import {AuthContext} from "../context/AuthContext.jsx";


export default function CompetitionDisciplines({ competitionId }) {
    const [disciplines, setDisciplines] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const { user } = useContext(AuthContext);
    const canEdit =
        user?.roles?.includes("admin") ||
        user?.roles?.includes("organizator");
    const reload = async () => {
        const res = await api.get(`/disciplines/competition/${competitionId}`);
        setDisciplines(res.data);
    };

    useEffect(() => {
        reload();
    }, [competitionId]);



    return (
        <section className="section-card">
            <h2>Disciplíny soutěže</h2>

            <AssignedDisciplinesList
                disciplines={disciplines}s
                competitionId={competitionId}
                canEdit={canEdit}
                onChange={reload}
            />

            <div className="actions-row">
                {canEdit && (
                <button onClick={() => setShowAssign(true)} className="btn-outline">
                    ➕ Přidat existující disciplínu
                </button>
                    )}

                {canEdit && (

                <button onClick={() => setShowCreate(true)} className="btn-primary">
                    Vytvořit novou disciplínu
                </button>
                )}

            </div>

            {showAssign && (
                <AddExistingDisciplineModal
                    competitionId={competitionId}
                    onClose={() => setShowAssign(false)}
                    onAdded={() => reload()}
                />
            )}

            {showCreate && (
                <CreateDisciplineModal
                    competitionId={competitionId}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => reload()}
                />
            )}
        </section>
    );
}