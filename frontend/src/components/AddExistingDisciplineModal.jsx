import {useEffect, useState} from "react";
import api from "../api/apiClient.js";
import Modal from "./Modal.jsx";

export default function AddExistingDisciplineModal({ competitionId, onClose, onAdded }) {
    const [all, setAll] = useState([]);

    useEffect(() => {
        api.get("/disciplines").then(res => setAll(res.data));
    }, []);

    async function assign(discipline_id) {
        await api.post("/disciplines/assign", {
            competition_id: competitionId,
            discipline_id
        });
        onAdded();
        onClose();
    }

    return (
        <Modal title="Vyber disciplínu" onClose={onClose}>
            {all.map(d => (
                <div key={d.discipline_id} className="select-row">
                    <span>{d.name} ({d.type})</span>
                    <button onClick={() => assign(d.discipline_id)}>Přidat</button>
                </div>
            ))}
        </Modal>
    );
}
