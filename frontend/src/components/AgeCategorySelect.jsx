import { useEffect, useState } from "react";
import api from "../api/apiClient";

export default function AgeCategorySelect({ value, onChange }) {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get("/age-categories").then(res => setCategories(res.data));
    }, []);

    function toggle(id) {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id]);
        }
    }

    return (
        <div>
            <h4>Věkové kategorie</h4>

            {categories.map(c => (
                <label key={c.age_category_id}>
                    <input
                        type="checkbox"
                        checked={value.includes(c.age_category_id)}
                        onChange={() => toggle(c.age_category_id)}
                    />
                    {c.name} ({c.min_age}–{c.max_age ?? "∞"})
                </label>
            ))}
        </div>
    );
}
