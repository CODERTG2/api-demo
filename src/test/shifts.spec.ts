import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { Shift } from "../models/Shift";
import { Volunteer } from "../models/Volunteer";

describe("Shifts and Signups API (/api/shifts)", () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {
            runtimeAdapters: { os: require("os") }
        } as any);
    }, 60000);

    afterEach(async () => {
        await Shift.deleteMany({});
        await Volunteer.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    }, 30000);

    describe("POST /api/shifts (Create Shift)", () => {
        it("should create a shift successfully with valid data", async () => {
            const shiftData = {
                title: "Morning Check-in",
                startTime: "2026-09-14T08:00:00Z",
                endTime: "2026-09-14T12:00:00Z",
                numNeeded: 3
            };

            const res = await request(app)
                .post("/api/shifts")
                .send(shiftData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("_id");
            expect(res.body.title).toBe(shiftData.title);
            expect(res.body.startTime).toBe(new Date(shiftData.startTime).toISOString());
            expect(res.body.endTime).toBe(new Date(shiftData.endTime).toISOString());
            expect(res.body.numNeeded).toBe(3);
            expect(res.body.volunteers).toEqual([]);
        });

        it("should fail validation with 400 when required fields are missing", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({ title: "Incomplete Shift" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
            expect(res.body.errors).toBeInstanceOf(Array);
            expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
        });

        it("should fail validation with 400 when numNeeded is non-positive", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Invalid Capacity Shift",
                    startTime: "2026-09-14T08:00:00Z",
                    endTime: "2026-09-14T12:00:00Z",
                    numNeeded: -2
                });

            expect(res.status).toBe(400);
            expect(res.body.errors.some((err: any) => err.field.includes("numNeeded"))).toBe(true);
        });

        it("should fail validation with 400 when numNeeded is 0", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Zero Capacity Shift",
                    startTime: "2026-09-14T08:00:00Z",
                    endTime: "2026-09-14T12:00:00Z",
                    numNeeded: 0
                });

            expect(res.status).toBe(400);
            expect(res.body.errors.some((err: any) => err.field.includes("numNeeded"))).toBe(true);
        });

        it("should fail validation with 400 when startTime is after endTime", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Invalid Times Shift",
                    startTime: "2026-09-14T14:00:00Z",
                    endTime: "2026-09-14T12:00:00Z",
                    numNeeded: 2
                });

            expect(res.status).toBe(400);
            expect(res.body.errors.some((err: any) => err.field.includes("startTime"))).toBe(true);
        });

        it("should fail validation with 400 when startTime is not a valid datetime", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Bad Time Shift",
                    startTime: "not-a-date",
                    endTime: "2026-09-14T12:00:00Z",
                    numNeeded: 2
                });

            expect(res.status).toBe(400);
            expect(res.body.errors.some((err: any) => err.field.includes("startTime"))).toBe(true);
        });
    });

    describe("GET /api/shifts (List Shifts)", () => {
        beforeEach(async () => {
            await Shift.create([
                {
                    title: "Day 1 Setup",
                    startTime: "2026-09-14T07:00:00Z",
                    endTime: "2026-09-14T10:00:00Z",
                    numNeeded: 2,
                    volunteers: []
                },
                {
                    title: "Day 1 Lunch",
                    startTime: "2026-09-14T11:00:00Z",
                    endTime: "2026-09-14T14:00:00Z",
                    numNeeded: 4,
                    volunteers: []
                },
                {
                    title: "Day 2 Teardown",
                    startTime: "2026-09-15T16:00:00Z",
                    endTime: "2026-09-15T20:00:00Z",
                    numNeeded: 5,
                    volunteers: []
                }
            ]);
        });

        it("should return all shifts when no date query is specified", async () => {
            const res = await request(app).get("/api/shifts");

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
        });

        it("should filter shifts by date query parameter", async () => {
            const res = await request(app).get("/api/shifts?date=2026-09-14");

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.every((s: any) => s.startTime.startsWith("2026-09-14"))).toBe(true);
        });

        it("should return 400 for invalid date format", async () => {
            const res = await request(app).get("/api/shifts?date=not-a-date");

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("PATCH /api/shifts/:id (Edit Shift)", () => {
        let shiftId: string;

        beforeEach(async () => {
            const shift = await Shift.create({
                title: "Original Title",
                startTime: "2026-09-14T10:00:00Z",
                endTime: "2026-09-14T12:00:00Z",
                numNeeded: 3,
                volunteers: []
            });
            shiftId = shift._id.toString();
        });

        it("should partially update shift fields", async () => {
            const res = await request(app)
                .patch(`/api/shifts/${shiftId}`)
                .send({ title: "Updated Title", numNeeded: 6 });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Updated Title");
            expect(res.body.numNeeded).toBe(6);
            expect(res.body.startTime).toBe("2026-09-14T10:00:00.000Z");
        });

        it("should return 404 if shift does not exist", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .patch(`/api/shifts/${fakeId}`)
                .send({ title: "New Title" });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Shift not found");
        });

        it("should return 400 if no fields to update are provided", async () => {
            const res = await request(app)
                .patch(`/api/shifts/${shiftId}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("should fail validation with 400 when startTime is after endTime", async () => {
            const res = await request(app)
                .patch(`/api/shifts/${shiftId}`)
                .send({ startTime: "2026-09-14T14:00:00Z" }); // Original endTime is 12:00:00Z

            expect(res.status).toBe(400);
            expect(res.body.errors.some((err: any) => err.field.includes("startTime"))).toBe(true);
        });
    });

    describe("POST /api/shifts/:id/signup (Volunteer Signup)", () => {
        let shiftId: string;

        beforeEach(async () => {
            await Volunteer.create({ _id: "v-alice", name: "Alice" });
            await Volunteer.create({ _id: "v-bob", name: "Bob" });
            await Volunteer.create({ _id: "v-charlie", name: "Charlie" });
            const shift = await Shift.create({
                title: "Information Desk",
                startTime: "2026-09-14T12:00:00Z",
                endTime: "2026-09-14T15:00:00Z",
                numNeeded: 2,
                volunteers: []
            });
            shiftId = shift._id.toString();
        });

        it("should sign up a volunteer using _id", async () => {
            const res = await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({ _id: "v-alice" });

            expect(res.status).toBe(200);
            expect(res.body.volunteers.length).toBe(1);
        });

        it("should sign up a volunteer with full volunteer data and upsert doc", async () => {
            const res = await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({
                    _id: "v-bob",
                    name: "Bob Builder",
                    email: "bob@illinois.edu"
                });

            expect(res.status).toBe(200);
            expect(res.body.volunteers.length).toBe(1);
            expect(res.body.volunteers[0]._id).toBe("v-bob");
            expect(res.body.volunteers[0].name).toBe("Bob Builder");
            expect(res.body.volunteers[0].email).toBe("bob@illinois.edu");

            const volunteerDoc = await Volunteer.findById("v-bob");
            expect(volunteerDoc).not.toBeNull();
            expect(volunteerDoc?.email).toBe("bob@illinois.edu");
        });

        it("should prevent duplicate signups for the same volunteer", async () => {
            await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({ _id: "v-alice" });

            const duplicateRes = await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({ _id: "v-alice" });

            expect(duplicateRes.status).toBe(400);
            expect(duplicateRes.body.message).toBe("Volunteer is already signed up for this shift");
        });

        it("should prevent signup when shift capacity is full", async () => {
            await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({ _id: "v-alice" });

            await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({ _id: "v-bob" });

            const fullRes = await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({ _id: "v-charlie" });

            expect(fullRes.status).toBe(400);
            expect(fullRes.body.message).toBe("Shift is full");
        });

        it("should return 404 for non-existent shift", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .post(`/api/shifts/${fakeId}/signup`)
                .send({ _id: "v-alice" });

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Shift not found");
        });

        it("should return 400 when _id is missing", async () => {
            const res = await request(app)
                .post(`/api/shifts/${shiftId}/signup`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("DELETE /api/shifts/:id/signup (Volunteer Cancels)", () => {
        let shiftId: string;

        beforeEach(async () => {
            await Volunteer.create({ _id: "v-alice", name: "Alice", email: "alice@test.com" });
            await Volunteer.create({ _id: "v-bob", name: "Bob", email: "bob@test.com" });

            const shift = await Shift.create({
                title: "Merch Booth",
                startTime: "2026-09-14T14:00:00Z",
                endTime: "2026-09-14T17:00:00Z",
                numNeeded: 3,
                volunteers: ["v-alice", "v-bob"]
            });
            shiftId = shift._id.toString();
        });

        it("should cancel volunteer signup via body parameter", async () => {
            const res = await request(app)
                .delete(`/api/shifts/${shiftId}/signup`)
                .send({ volunteerId: "v-alice" });

            expect(res.status).toBe(200);
            expect(res.body.volunteers.length).toBe(1);
            expect(res.body.volunteers[0]._id).toBe("v-bob");
        });

        it("should cancel volunteer signup via query parameter", async () => {
            const res = await request(app)
                .delete(`/api/shifts/${shiftId}/signup?volunteerId=v-bob`);

            expect(res.status).toBe(200);
            expect(res.body.volunteers.length).toBe(1);
            expect(res.body.volunteers[0]._id).toBe("v-alice");
        });

        it("should return 400 if volunteer is not signed up for the shift", async () => {
            const res = await request(app)
                .delete(`/api/shifts/${shiftId}/signup`)
                .send({ volunteerId: "v-charlie" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Volunteer is not signed up for this shift");
        });

        it("should return 400 if volunteerId is missing", async () => {
            const res = await request(app)
                .delete(`/api/shifts/${shiftId}/signup`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    describe("DELETE /api/shifts/:id (Delete Shift)", () => {
        it("should delete shift and return 200", async () => {
            const shift = await Shift.create({
                title: "Shift To Delete",
                startTime: "2026-09-14T18:00:00Z",
                endTime: "2026-09-14T21:00:00Z",
                numNeeded: 2,
                volunteers: []
            });
            const shiftId = shift._id.toString();

            const res = await request(app).delete(`/api/shifts/${shiftId}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Shift deleted successfully");

            const check = await Shift.findById(shiftId);
            expect(check).toBeNull();
        });

        it("should return 404 if shift does not exist", async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await request(app).delete(`/api/shifts/${fakeId}`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Shift not found");
        });
    });
});
