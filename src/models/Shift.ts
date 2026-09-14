import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    numNeeded: { type: Number, required: true },
    volunteers: [{ type: String, ref: "Volunteer" }]
});

export const Shift = mongoose.model("Shift", shiftSchema);
