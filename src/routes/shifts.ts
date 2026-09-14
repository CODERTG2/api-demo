import { Router } from "express";
import crypto from "crypto";
import { validate } from "../middlewares/validate";
import { createShiftSchema, updateShiftSchema, getShiftQuerySchema, modifySeriesQuerySchema } from "../schemas/shift";
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
    const { title, startTime, endTime, numNeeded, recurrence } = req.body;

    const startDate = new Date(startTime);
    const endDateObj = new Date(endTime);

    if (startDate >= endDateObj) {
        return res.status(400).json({
            message: "Validation failed",
            errors: [{ field: "startTime", message: "startTime must be before endTime" }]
        });
    }

    if (!recurrence) {
        const shift = new Shift({ title, startTime, endTime, numNeeded });
        await shift.save();
        return res.status(201).json(shift);
    }

    const { frequency, endDate: recurrenceEndDateStr } = recurrence;
    const recurrenceEndDate = new Date(recurrenceEndDateStr);

    if (startDate > recurrenceEndDate) {
        return res.status(400).json({
            message: "Validation failed",
            errors: [{ field: "recurrence.endDate", message: "endDate must be after startTime" }]
        });
    }

    const recurringGroupId = crypto.randomUUID();
    const shiftsToCreate = [];
    
    let currentStart = new Date(startDate);
    let currentEnd = new Date(endDateObj);

    while (currentStart <= recurrenceEndDate) {
        let shouldCreate = false;
        const dayOfWeek = currentStart.getDay();

        if (frequency === "daily") {
            shouldCreate = true;
        } else if (frequency === "weekly") {
            shouldCreate = true;
        } else if (frequency === "weekday") {
            shouldCreate = dayOfWeek !== 0 && dayOfWeek !== 6;
        } else if (frequency === "weekend") {
            shouldCreate = dayOfWeek === 0 || dayOfWeek === 6;
        }

        if (shouldCreate) {
            shiftsToCreate.push({
                title,
                startTime: new Date(currentStart),
                endTime: new Date(currentEnd),
                numNeeded,
                recurringGroupId
            });
        }

        if (frequency === "weekly") {
            currentStart.setDate(currentStart.getDate() + 7);
            currentEnd.setDate(currentEnd.getDate() + 7);
        } else {
            currentStart.setDate(currentStart.getDate() + 1);
            currentEnd.setDate(currentEnd.getDate() + 1);
        }
    }

    if (shiftsToCreate.length === 0) {
        return res.status(400).json({
            message: "Validation failed",
            errors: [{ field: "recurrence", message: "No shifts could be created with the given rules" }]
        });
    }

    const createdShifts = await Shift.insertMany(shiftsToCreate);
    return res.status(201).json(createdShifts);
});

// PATCH /api/shifts/:id — partially update a shift
shiftsRouter.patch("/:id", validate(modifySeriesQuerySchema, "query"), validate(updateShiftSchema), async (req, res) => {
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

    const updateSeries = req.query.updateSeries === "true";

    if (updateSeries && existingShift.recurringGroupId) {
        const futureShifts = await Shift.find({
            recurringGroupId: existingShift.recurringGroupId,
            startTime: { $gte: existingShift.startTime }
        });

        let startDiff = 0;
        let endDiff = 0;
        if (req.body.startTime) {
            startDiff = new Date(req.body.startTime).getTime() - existingShift.startTime.getTime();
        }
        if (req.body.endTime) {
            endDiff = new Date(req.body.endTime).getTime() - existingShift.endTime.getTime();
        }

        const promises = futureShifts.map(shift => {
            const updateObj: any = { ...req.body };
            if (req.body.startTime) {
                updateObj.startTime = new Date(shift.startTime.getTime() + startDiff);
            }
            if (req.body.endTime) {
                updateObj.endTime = new Date(shift.endTime.getTime() + endDiff);
            }
            return Shift.findByIdAndUpdate(shift._id, updateObj, { new: true });
        });
        
        await Promise.all(promises);
        const updatedTarget = await Shift.findById(req.params.id);
        return res.json(updatedTarget);
    } else {
        const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.json(shift);
    }
});

// DELETE /api/shifts/:id — delete a shift
shiftsRouter.delete("/:id", validate(modifySeriesQuerySchema, "query"), async (req, res) => {
    const existingShift = await Shift.findById(req.params.id);
    if (!existingShift) {
        return res.status(404).json({ message: "Shift not found" });
    }

    const deleteSeries = req.query.deleteSeries === "true";

    if (deleteSeries && existingShift.recurringGroupId) {
        await Shift.deleteMany({
            recurringGroupId: existingShift.recurringGroupId,
            startTime: { $gte: existingShift.startTime }
        });
        return res.json({ message: "Series deleted successfully" });
    } else {
        await Shift.findByIdAndDelete(req.params.id);
        return res.json({ message: "Shift deleted successfully" });
    }
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
