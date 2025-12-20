import {useNavigate} from "react-router-dom";
import {useState} from "react";
import api from "../api/apiClient.js";

export default function CreateCompetition() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        description: "",
        location: "",
        start_date: "",
        end_date: "",
        reg_start: "",
        reg_end: ""
    });

    async function submit() {
        try {
            await api.post("/competitions", form);
            alert("Soutěž vytvořena");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.error || "Nelze vytvořit soutěž");
        }
    }

    return (
        <div className="page-wrapper">
            <h1>Nová soutěž</h1>

            <div className="form-card">
                <input
                    placeholder="Název soutěže"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                />

                <textarea
                    placeholder="Popis"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />

                <input
                    placeholder="Místo konání"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                />

                <label>Datum konání</label>
                <input type="date"
                       onChange={e => setForm({ ...form, start_date: e.target.value })} />
                <input type="date"
                       onChange={e => setForm({ ...form, end_date: e.target.value })} />

                <label>Registrace</label>
                <input type="date"
                       onChange={e => setForm({ ...form, reg_start: e.target.value })} />
                <input type="date"
                       onChange={e => setForm({ ...form, reg_end: e.target.value })} />

                <button className="btn-primary" onClick={submit}>
                    ✔ Vytvořit soutěž
                </button>
            </div>
        </div>
    );
}
