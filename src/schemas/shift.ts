import { z } from "zod";

export const getShiftQuerySchema = z.object({
    date: z.string().date("date must be in YYYY-MM-DD format").optional(),
});

export const createShiftSchema = z.object({
    title: z.string().min(1, "title is required"),
    startTime: z.string().datetime("startTime must be a valid ISO datetime"),
    endTime: z.string().datetime("endTime must be a valid ISO datetime"),
    numNeeded: z.number().int("numNeeded must be an integer").positive("numNeeded must be positive"),
});

export const updateShiftSchema = createShiftSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
);