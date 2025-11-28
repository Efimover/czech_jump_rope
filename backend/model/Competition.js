import mongoose from "mongoose";

const CompetitionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },

    description: { type: String },

    disciplines: [
        {
            disciplineId: String,
            name: String,
            type: { type: String, enum: ["individual", "team"] }

        }
    ],

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Competition", CompetitionSchema);

