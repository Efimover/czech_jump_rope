export function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString("cs-CZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}