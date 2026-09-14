import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema({
    _id: { type: String, required: true, alias: "netID" },
    name: { type: String, required: true },
    email: String
});

export const Volunteer = mongoose.model("Volunteer", volunteerSchema);