import { z } from "zod";

export const signupSchema = z.object({
    _id: z.string().min(1, "volunteerId is required"),
    name: z.string().optional(),
    email: z.string().email("email must be valid").optional(),
});