import {useEffect, useState} from "react";
import api from "../api/apiClient.js";
import Modal from "./Modal.jsx";

export default function CreateDisciplineModal({ competitionId, onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "",
        type: "",
        is_team: false,
        pocet_athletes: null,
        age_categories: []
    });

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get("/age-categories").then(res => setCategories(res.data));
    }, []);

    async function submit() {
        const res = await api.post("/disciplines", form);

        await api.post("/disciplines/assign", {
            competition_id: competitionId,
            discipline_id: res.data.discipline_id
        });

        onCreated();
        onClose();
    }

    return (
        <Modal title="Nová disciplína">
            <input
                placeholder="Název"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
            >
                <option value="">Typ</option>
                <option value="speed">Speed</option>
                <option value="freestyle">Freestyle</option>
                <option value="double_dutch">Double Dutch</option>
                <option value="chinese_wheel">Chinese Wheel</option>
                <option value="other">Jiný</option>
            </select>

            <label>
                <input
                    type="checkbox"
                    checked={form.is_team}
                    onChange={e =>
                        setForm({ ...form, is_team: e.target.checked })
                    }
                />
                Týmová disciplína
            </label>

            {form.is_team && (
                <input
                    type="number"
                    placeholder="Počet atletů v týmu"
                    value={form.pocet_athletes || ""}
                    onChange={e =>
                        setForm({ ...form, pocet_athletes: Number(e.target.value) })
                    }
                />
            )}

            <h4>Věkové kategorie</h4>
            {categories.map(c => (
                <label key={c.age_category_id}>
                    <input
                        type="checkbox"
                        checked={form.age_categories.includes(c.age_category_id)}
                        onChange={e =>
                            setForm(f => ({
                                ...f,
                                age_categories: e.target.checked
                                    ? [...f.age_categories, c.age_category_id]
                                    : f.age_categories.filter(id => id !== c.age_category_id)
                            }))
                        }
                    />
                    {c.name} ({c.min_age}–{c.max_age ?? "∞"})
                </label>
            ))}

            <button onClick={submit} className="btn-primary">
                ✔ Vytvořit disciplínu
            </button>
        </Modal>
    );
}
