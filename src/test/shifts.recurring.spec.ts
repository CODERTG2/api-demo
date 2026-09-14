import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { Shift } from "../models/Shift";

describe("Recurring Shifts API", () => {
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
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    }, 30000);

    describe("POST /api/shifts (Recurring)", () => {
        it("should create multiple daily shifts", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Daily Shift",
                    startTime: "2026-09-14T09:00:00.000Z",
                    endTime: "2026-09-14T17:00:00.000Z",
                    numNeeded: 2,
                    recurrence: {
                        frequency: "daily",
                        endDate: "2026-09-16T17:00:00.000Z"
                    }
                });
            
            expect(res.status).toBe(201);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3); // 14, 15, 16

            const dbShifts = await Shift.find({ title: "Daily Shift" }).sort("startTime");
            expect(dbShifts.length).toBe(3);
            expect(dbShifts[0].recurringGroupId).toBeDefined();
            expect(dbShifts[0].recurringGroupId).toBe(dbShifts[1].recurringGroupId);
            expect(dbShifts[1].recurringGroupId).toBe(dbShifts[2].recurringGroupId);
            
            expect(dbShifts[0].startTime.toISOString()).toBe("2026-09-14T09:00:00.000Z");
            expect(dbShifts[1].startTime.toISOString()).toBe("2026-09-15T09:00:00.000Z");
            expect(dbShifts[2].startTime.toISOString()).toBe("2026-09-16T09:00:00.000Z");
        });

        it("should create weekly shifts", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Weekly Shift",
                    startTime: "2026-09-14T09:00:00.000Z", // Monday
                    endTime: "2026-09-14T17:00:00.000Z",
                    numNeeded: 2,
                    recurrence: {
                        frequency: "weekly",
                        endDate: "2026-09-28T17:00:00.000Z" // 3 weeks: 14, 21, 28
                    }
                });
            
            expect(res.status).toBe(201);
            expect(res.body.length).toBe(3);
        });

        it("should create weekday shifts", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Weekday Shift",
                    startTime: "2026-09-18T09:00:00.000Z", // Friday
                    endTime: "2026-09-18T17:00:00.000Z",
                    numNeeded: 2,
                    recurrence: {
                        frequency: "weekday",
                        endDate: "2026-09-21T17:00:00.000Z" // Friday, Saturday(skip), Sunday(skip), Monday
                    }
                });
            
            expect(res.status).toBe(201);
            expect(res.body.length).toBe(2);
            expect(res.body[0].startTime).toBe("2026-09-18T09:00:00.000Z");
            expect(res.body[1].startTime).toBe("2026-09-21T09:00:00.000Z");
        });

        it("should create weekend shifts", async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Weekend Shift",
                    startTime: "2026-09-18T09:00:00.000Z", // Friday
                    endTime: "2026-09-18T17:00:00.000Z",
                    numNeeded: 2,
                    recurrence: {
                        frequency: "weekend",
                        endDate: "2026-09-21T17:00:00.000Z" // Friday(skip), Saturday, Sunday, Monday(skip)
                    }
                });
            
            expect(res.status).toBe(201);
            expect(res.body.length).toBe(2);
            expect(res.body[0].startTime).toBe("2026-09-19T09:00:00.000Z");
            expect(res.body[1].startTime).toBe("2026-09-20T09:00:00.000Z");
        });
    });

    describe("PATCH /api/shifts/:id (Series)", () => {
        let shifts: any[] = [];
        beforeEach(async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Series Shift",
                    startTime: "2026-09-14T09:00:00.000Z",
                    endTime: "2026-09-14T17:00:00.000Z",
                    numNeeded: 2,
                    recurrence: {
                        frequency: "daily",
                        endDate: "2026-09-16T17:00:00.000Z"
                    }
                });
            shifts = res.body;
        });

        it("should update a single shift without affecting others", async () => {
            const res = await request(app)
                .patch(`/api/shifts/${shifts[1]._id}`)
                .send({
                    title: "Updated Single"
                });
            
            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Updated Single");

            const dbShifts = await Shift.find({ title: "Series Shift" });
            expect(dbShifts.length).toBe(2); // 0 and 2 are untouched
        });

        it("should update the series from a specific point onward", async () => {
            // Update shift[1] (15th) and onwards
            const res = await request(app)
                .patch(`/api/shifts/${shifts[1]._id}?updateSeries=true`)
                .send({
                    title: "Updated Series",
                    numNeeded: 5
                });
            
            expect(res.status).toBe(200);
            
            const first = await Shift.findById(shifts[0]._id);
            expect(first?.title).toBe("Series Shift"); // Unchanged
            expect(first?.numNeeded).toBe(2);

            const second = await Shift.findById(shifts[1]._id);
            expect(second?.title).toBe("Updated Series"); // Changed
            expect(second?.numNeeded).toBe(5);

            const third = await Shift.findById(shifts[2]._id);
            expect(third?.title).toBe("Updated Series"); // Changed
            expect(third?.numNeeded).toBe(5);
        });

        it("should appropriately shift times when times are updated for a series", async () => {
            // Update shift[0] to start 1 hour later (10:00 instead of 09:00)
            const res = await request(app)
                .patch(`/api/shifts/${shifts[0]._id}?updateSeries=true`)
                .send({
                    startTime: "2026-09-14T10:00:00.000Z" // +1 hour
                });
            
            expect(res.status).toBe(200);

            const allShifts = await Shift.find({ recurringGroupId: shifts[0].recurringGroupId }).sort("startTime");
            expect(allShifts[0].startTime.toISOString()).toBe("2026-09-14T10:00:00.000Z");
            expect(allShifts[1].startTime.toISOString()).toBe("2026-09-15T10:00:00.000Z"); // also +1 hour
            expect(allShifts[2].startTime.toISOString()).toBe("2026-09-16T10:00:00.000Z"); // also +1 hour
        });
    });

    describe("DELETE /api/shifts/:id (Series)", () => {
        let shifts: any[] = [];
        beforeEach(async () => {
            const res = await request(app)
                .post("/api/shifts")
                .send({
                    title: "Series Shift",
                    startTime: "2026-09-14T09:00:00.000Z",
                    endTime: "2026-09-14T17:00:00.000Z",
                    numNeeded: 2,
                    recurrence: {
                        frequency: "daily",
                        endDate: "2026-09-16T17:00:00.000Z"
                    }
                });
            shifts = res.body;
        });

        it("should delete a single shift without affecting others", async () => {
            const res = await request(app).delete(`/api/shifts/${shifts[1]._id}`);
            expect(res.status).toBe(200);

            const count = await Shift.countDocuments({ recurringGroupId: shifts[0].recurringGroupId });
            expect(count).toBe(2);
        });

        it("should delete the series from a specific point onward", async () => {
            const res = await request(app).delete(`/api/shifts/${shifts[1]._id}?deleteSeries=true`);
            expect(res.status).toBe(200);

            const count = await Shift.countDocuments({ recurringGroupId: shifts[0].recurringGroupId });
            expect(count).toBe(1); // Only the first one remains

            const first = await Shift.findById(shifts[0]._id);
            expect(first).toBeDefined();
        });
    });
});
