//
//
// export const getAllCompetitions = async (req, res) => {
//     try {
//         const competitions = await prisma.competition.findMany();
//         res.json(competitions);
//     } catch (err) {
//         res.status(500).json({ error: "Server error" });
//     }
// };
//
// export const getCompetitionById = async (req, res) => {
//     try {
//         const id = Number(req.params.id);
//         const competition = await prisma.competition.findUnique({ where: { id } });
//
//         if (!competition) {
//             return res.status(404).json({ error: "Not found" });
//         }
//
//         res.json(competition);
//     } catch (err) {
//         res.status(500).json({ error: "Server error" });
//     }
// };
