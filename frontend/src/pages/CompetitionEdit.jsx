import { useParams } from "react-router-dom";
import CompetitionDisciplines from "../components/CompetitionDisciplines";

export default function CompetitionEdit() {
    const { competitionId } = useParams();

    return (
        <div className="page-wrapper">
            <h1>Správa soutěže</h1>

            <CompetitionDisciplines competitionId={competitionId} />
        </div>
    );
}
