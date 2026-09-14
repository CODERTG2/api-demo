import { Router } from "express";
import { validate } from "../middlewares/validate";
import { createShiftSchema, updateShiftSchema, getShiftQuerySchema } from "../schemas/shift";
import { signupSchema } from "../schemas/volunteer";
import { Shift } from "../models/Shift";
import { Volunteer } from "../models/Volunteer";

export const shiftsRouter = Router();

// GET /api/shifts — list all shifts, optional ?date=YYYY-MM-DD filter
shiftsRouter.get("/", validate(getShiftQuerySchema, "query"), async (req, res) => {
    const { date } = req.query as { date?: string };
    const query: Record<string, unknown> = {};
    if (date) {
        const start = new Date(date);
        const end = new Date(date);
        end.setUTCDate(end.getUTCDate() + 1);
        query.startTime = { $gte: start, $lt: end };
    }
    const shifts = await Shift.find(query).populate("volunteers");
    return res.json(shifts);
});

// POST /api/shifts — create a new shift
shiftsRouter.post("/", validate(createShiftSchema), async (req, res) => {
    const { title, startTime, endTime, numNeeded } = req.body;

    if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({
            message: "Validation failed",
            errors: [{ field: "startTime", message: "startTime must be before endTime" }]
        });
    }

    const shift = new Shift({ title, startTime, endTime, numNeeded });
    await shift.save();
    return res.status(201).json(shift);
});

// TODO: recurring shifts.

// PATCH /api/shifts/:id — partially update a shift
shiftsRouter.patch("/:id", validate(updateShiftSchema), async (req, res) => {
    const existingShift = await Shift.findById(req.params.id);
    if (!existingShift) {
        return res.status(404).json({ message: "Shift not found" });
    }

    const newStartTime = req.body.startTime ? new Date(req.body.startTime) : existingShift.startTime;
    const newEndTime = req.body.endTime ? new Date(req.body.endTime) : existingShift.endTime;

    if (newStartTime >= newEndTime) {
        return res.status(400).json({
            message: "Validation failed",
            errors: [{ field: "startTime", message: "startTime must be before endTime" }]
        });
    }

    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(shift);
});

// DELETE /api/shifts/:id — delete a shift
shiftsRouter.delete("/:id", async (req, res) => {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
    }
    return res.json({ message: "Shift deleted successfully" });
});

// GET api/shifts/needed - returns shifts that need volunteers

// POST /api/shifts/:id/signup — volunteer signs up
shiftsRouter.post("/:id/signup", validate(signupSchema), async (req, res) => {
    const { _id: volunteerId, name, email } = req.body;
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
    }
    if (shift.volunteers.includes(volunteerId)) {
        return res.status(400).json({ message: "Volunteer is already signed up for this shift" });
    }
    if (shift.volunteers.length >= shift.numNeeded) {
        return res.status(400).json({ message: "Shift is full" });
    }
    if (name) {
        await Volunteer.findByIdAndUpdate(
            volunteerId,
            { _id: volunteerId, name, ...(email && { email }) },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
    shift.volunteers.push(volunteerId);
    await shift.save();
    const populated = await shift.populate("volunteers");
    return res.json(populated);
});

// DELETE /api/shifts/:id/signup — volunteer cancels (volunteerId from body or query)
shiftsRouter.delete("/:id/signup", async (req, res) => {
    const volunteerId = (req.body?.volunteerId ?? req.query?.volunteerId) as string | undefined;
    if (!volunteerId) {
        return res.status(400).json({
            message: "Validation failed",
            errors: [{ field: "volunteerId", message: "volunteerId is required" }],
        });
    }
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
    }
    if (!shift.volunteers.includes(volunteerId)) {
        return res.status(400).json({ message: "Volunteer is not signed up for this shift" });
    }
    shift.volunteers = shift.volunteers.filter((id: string) => id !== volunteerId);
    await shift.save();
    const populated = await shift.populate("volunteers");
    return res.json(populated);
});
