import { useEffect, useState } from "react";
import api from "../api/apiClient";

export default function DisciplinePicker({ selected, onChange }) {
    const [disciplines, setDisciplines] = useState([]);

    useEffect(() => {
        api.get("/disciplines").then(res => setDisciplines(res.data));
    }, []);

    function toggle(id) {
        if (selected.includes(id)) {
            onChange(selected.filter(d => d !== id));
        } else {
            onChange([...selected, id]);
        }
    }

    return (
        <div className="discipline-picker">
            <h3>Vyber disciplíny</h3>

            {disciplines.map(d => (
                <label key={d.discipline_id} className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={selected.includes(d.discipline_id)}
                        onChange={() => toggle(d.discipline_id)}
                    />
                    {d.name} ({d.type})
                </label>
            ))}
        </div>
    );
}
