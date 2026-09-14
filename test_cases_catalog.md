# Comprehensive Test Cases Catalog

This document details every single test case in the test suite across [shifts.recurring.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts) and [shifts.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts), alongside the application baseline suites ([index.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/index.spec.ts) and [error.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/error.spec.ts)).

---

## 📊 Summary Dashboard

| Test Suite | Spec File | Test Count | Status |
| :--- | :--- | :---: | :---: |
| **Shift Management & Signups** | [`src/test/shifts.spec.ts`](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts) | **31** | Passed |
| **Recurring Shifts & Series Ops** | [`src/test/shifts.recurring.spec.ts`](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts) | **9** | Passed |
| **Index & Home Routes** | [`src/test/index.spec.ts`](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/index.spec.ts) | **2** | Passed |
| **Error Handling Routes** | [`src/test/error.spec.ts`](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/error.spec.ts) | **1** | Passed |
| **TOTAL** | **4 Test Suites** | **43** | **100% Passing** |

---

## Part 1: Shift Operations & Signups (`shifts.spec.ts`)
> File: [shifts.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts) (31 tests)

### 1.1 POST `/api/shifts` — Create Single Shift

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 1 | `should create a shift successfully with valid data` | [shifts.spec.ts:L32-L51](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L32-L51) | Valid shift object (`title`, `startTime`, `endTime`, `numNeeded: 3`) | Status `201 Created`<br>• Generated `_id`<br>• Matched fields<br>• Empty `volunteers: []` |
| 2 | `should fail validation with 400 when required fields are missing` | [shifts.spec.ts:L53-L62](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L53-L62) | Payload with only `{ title: "Incomplete Shift" }` | Status `400 Bad Request`<br>• `message: "Validation failed"`<br>• `errors.length >= 3` |
| 3 | `should fail validation with 400 when numNeeded is non-positive` | [shifts.spec.ts:L64-L76](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L64-L76) | Shift payload with `numNeeded: -2` | Status `400 Bad Request`<br>• Error identifies `numNeeded` field |
| 4 | `should fail validation with 400 when numNeeded is 0` | [shifts.spec.ts:L78-L90](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L78-L90) | Shift payload with `numNeeded: 0` | Status `400 Bad Request`<br>• Error identifies `numNeeded` field |
| 5 | `should fail validation with 400 when startTime is after endTime` | [shifts.spec.ts:L92-L104](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L92-L104) | `startTime: 14:00:00Z`<br>`endTime: 12:00:00Z` | Status `400 Bad Request`<br>• Error flags chronological order on `startTime` |
| 6 | `should fail validation with 400 when startTime is not a valid datetime` | [shifts.spec.ts:L106-L118](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L106-L118) | `startTime: "not-a-date"` | Status `400 Bad Request`<br>• ISO 8601 validation failure |

---

### 1.2 GET `/api/shifts` — List & Filter Shifts

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 7 | `should return all shifts when no date query is specified` | [shifts.spec.ts:L148-L153](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L148-L153) | Query without parameters (`GET /api/shifts`) | Status `200 OK`<br>• Returns all 3 seeded shifts |
| 8 | `should filter shifts by date query parameter` | [shifts.spec.ts:L155-L161](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L155-L161) | Query `?date=2026-09-14` | Status `200 OK`<br>• Returns 2 shifts occurring on `2026-09-14` |
| 9 | `should return 400 for invalid date format` | [shifts.spec.ts:L163-L168](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L163-L168) | Query `?date=not-a-date` | Status `400 Bad Request`<br>• `message: "Validation failed"` |

---

### 1.3 PATCH `/api/shifts/:id` — Single Shift Edits

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 10 | `should partially update shift fields` | [shifts.spec.ts:L185-L194](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L185-L194) | `{ title: "Updated Title", numNeeded: 6 }` | Status `200 OK`<br>• Updates specified fields<br>• Preserves unedited fields (`startTime`) |
| 11 | `should return 404 if shift does not exist` | [shifts.spec.ts:L196-L204](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L196-L204) | Non-existent `ObjectId` | Status `404 Not Found`<br>• `message: "Shift not found"` |
| 12 | `should return 400 if no fields to update are provided` | [shifts.spec.ts:L206-L213](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L206-L213) | Empty object `{}` | Status `400 Bad Request`<br>• Rejects no-op update |
| 13 | `should fail validation with 400 when startTime is after endTime` | [shifts.spec.ts:L215-L222](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L215-L222) | `startTime: 14:00:00Z` against existing `endTime: 12:00:00Z` | Status `400 Bad Request`<br>• Dynamic cross-field time comparison failure |

---

### 1.4 POST `/api/shifts/:id/signup` — Volunteer Signups

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 14 | `should sign up a volunteer using _id` | [shifts.spec.ts:L242-L249](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L242-L249) | `{ _id: "v-alice" }` for pre-existing volunteer | Status `200 OK`<br>• Volunteer added to shift `volunteers` array |
| 15 | `should sign up a volunteer with full volunteer data and upsert doc` | [shifts.spec.ts:L251-L269](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L251-L269) | `{ _id: "v-bob", name: "Bob Builder", email: "bob@illinois.edu" }` | Status `200 OK`<br>• Upserts Volunteer document in MongoDB<br>• Populates volunteer in shift response |
| 16 | `should prevent duplicate signups for the same volunteer` | [shifts.spec.ts:L271-L282](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L271-L282) | Duplicate signup call for same `_id` | Status `400 Bad Request`<br>• `message: "Volunteer is already signed up for this shift"` |
| 17 | `should prevent signup when shift capacity is full` | [shifts.spec.ts:L284-L299](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L284-L299) | Signup attempt when `volunteers.length >= numNeeded` | Status `400 Bad Request`<br>• `message: "Shift is full"` |
| 18 | `should return 404 for non-existent shift` | [shifts.spec.ts:L301-L309](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L301-L309) | Random shift `ObjectId` | Status `404 Not Found`<br>• `message: "Shift not found"` |
| 19 | `should return 400 when _id is missing` | [shifts.spec.ts:L311-L318](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L311-L318) | Empty body `{}` | Status `400 Bad Request`<br>• `message: "Validation failed"` |

---

### 1.5 DELETE `/api/shifts/:id/signup` — Volunteer Cancellation

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 20 | `should cancel volunteer signup via body parameter` | [shifts.spec.ts:L338-L346](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L338-L346) | Body: `{ volunteerId: "v-alice" }` | Status `200 OK`<br>• Removes volunteer from shift<br>• Remaining array has length 1 |
| 21 | `should cancel volunteer signup via query parameter` | [shifts.spec.ts:L348-L355](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L348-L355) | Query: `?volunteerId=v-bob` | Status `200 OK`<br>• Removes volunteer from shift |
| 22 | `should return 400 if volunteer is not signed up for the shift` | [shifts.spec.ts:L357-L364](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L357-L364) | Volunteer ID not enrolled in shift | Status `400 Bad Request`<br>• `message: "Volunteer is not signed up for this shift"` |
| 23 | `should return 400 if volunteerId is missing` | [shifts.spec.ts:L366-L373](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L366-L373) | Request without body or query param | Status `400 Bad Request`<br>• `message: "Validation failed"` |

---

### 1.6 DELETE `/api/shifts/:id` — Delete Single Shift

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 24 | `should delete shift and return 200` | [shifts.spec.ts:L377-L393](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L377-L393) | Target existing shift `ObjectId` | Status `200 OK`<br>• `message: "Shift deleted successfully"`<br>• Shift permanently removed from DB |
| 25 | `should return 404 if shift does not exist` | [shifts.spec.ts:L395-L400](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L395-L400) | Random `ObjectId` | Status `404 Not Found`<br>• `message: "Shift not found"` |

---

### 1.7 GET `/api/shifts/needed` — Urgency Ranking Algorithm

> **Urgency Formula:**  
> $$\text{Urgency} = \frac{\text{numNeeded} - \text{volunteers.length}}{\text{daysAway} + 1}$$

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 26 | `should rank shifts by urgency descending (A > B > D from image)` | [shifts.spec.ts:L411-L429](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L411-L429) | • Shift A: daysAway=1, needed=10, signed=5 (U=2.50)<br>• Shift B: daysAway=5, needed=10, signed=2 (U=1.33)<br>• Shift D: daysAway=10, needed=5, signed=0 (U=0.45) | Status `200 OK`<br>• Shifts ordered strictly: `[Shift A, Shift B, Shift D]` |
| 27 | `should rank Shift C (daysAway=1, numNeeded=50, signedUp=25) highest — urgency=12.50` | [shifts.spec.ts:L431-L449](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L431-L449) | • Shift C: 25 needed / 2 days = 12.50<br>• Shift A: 5 needed / 2 days = 2.50 | Status `200 OK`<br>• Shift C ordered 1st with `urgency` close to 12.5<br>• Shift A ordered 2nd with `urgency` close to 2.5 |
| 28 | `should not include full shifts (volunteers >= numNeeded)` | [shifts.spec.ts:L451-L463](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L451-L463) | One full shift (`2/2`) and one open shift (`1/2`) | Status `200 OK`<br>• Excludes full shift; returns only open shift |
| 29 | `should not include past shifts` | [shifts.spec.ts:L465-L476](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L465-L476) | One past shift (yesterday) and one future shift | Status `200 OK`<br>• Excludes past shift; returns only future shift |
| 30 | `should return at most 5 shifts` | [shifts.spec.ts:L478-L493](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L478-L493) | 8 open future shifts | Status `200 OK`<br>• Caps result array length to at most 5 |
| 31 | `should return empty array when no shifts need volunteers` | [shifts.spec.ts:L495-L499](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.spec.ts#L495-L499) | Database with 0 unfilled future shifts | Status `200 OK`<br>• Returns empty array `[]` |

---

## Part 2: Recurring Shifts & Series Management (`shifts.recurring.spec.ts`)
> File: [shifts.recurring.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts) (9 tests)

### 2.1 POST `/api/shifts` — Recurring Pattern Generation

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 32 | `should create multiple daily shifts` | [shifts.recurring.spec.ts:L30-L57](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L30-L57) | `frequency: "daily"`, start: Sept 14, end: Sept 16 | Status `201 Created`<br>• Returns array of 3 shifts<br>• All share identical `recurringGroupId`<br>• Start times on 14th, 15th, 16th |
| 33 | `should create weekly shifts` | [shifts.recurring.spec.ts:L59-L75](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L59-L75) | `frequency: "weekly"`, start: Monday Sept 14, end: Sept 28 | Status `201 Created`<br>• 3 weekly shifts generated (14th, 21st, 28th) |
| 34 | `should create weekday shifts` | [shifts.recurring.spec.ts:L77-L95](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L77-L95) | `frequency: "weekday"`, start: Friday Sept 18, end: Monday Sept 21 | Status `201 Created`<br>• 2 shifts created (Fri Sept 18, Mon Sept 21)<br>• Skips Saturday and Sunday |
| 35 | `should create weekend shifts` | [shifts.recurring.spec.ts:L97-L115](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L97-L115) | `frequency: "weekend"`, start: Friday Sept 18, end: Monday Sept 21 | Status `201 Created`<br>• 2 shifts created (Sat Sept 19, Sun Sept 20)<br>• Skips Friday and Monday |

---

### 2.2 PATCH `/api/shifts/:id` — Recurring Series Updates

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 36 | `should update a single shift without affecting others` | [shifts.recurring.spec.ts:L136-L148](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L136-L148) | `PATCH /api/shifts/:id` (without `updateSeries` param), body `{ title: "Updated Single" }` on 2nd shift | Status `200 OK`<br>• Only the target shift is modified<br>• Other shifts in the series keep `"Series Shift"` |
| 37 | `should update the series from a specific point onward` | [shifts.recurring.spec.ts:L150-L172](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L150-L172) | `PATCH /api/shifts/:id?updateSeries=true`<br>Target 2nd shift (Sept 15), body `{ title: "Updated Series", numNeeded: 5 }` | Status `200 OK`<br>• 1st shift (Sept 14) remains untouched (`title: "Series Shift"`, `numNeeded: 2`)<br>• 2nd & 3rd shifts are updated (`title: "Updated Series"`, `numNeeded: 5`) |
| 38 | `should appropriately shift times when times are updated for a series` | [shifts.recurring.spec.ts:L174-L188](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L174-L188) | `PATCH /api/shifts/:id?updateSeries=true`<br>1st shift `startTime` moved +1 hour (09:00 -> 10:00 UTC) | Status `200 OK`<br>• Shifts 1, 2, and 3 each propagate the +1 hr time offset into their respective days (10:00 UTC) |

---

### 2.3 DELETE `/api/shifts/:id` — Recurring Series Deletion

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 39 | `should delete a single shift without affecting others` | [shifts.recurring.spec.ts:L209-L215](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L209-L215) | `DELETE /api/shifts/:id` (without `deleteSeries` param) on 2nd shift | Status `200 OK`<br>• Removes only 2nd shift<br>• 2 remaining shifts stay in `recurringGroupId` |
| 40 | `should delete the series from a specific point onward` | [shifts.recurring.spec.ts:L217-L226](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/shifts.recurring.spec.ts#L217-L226) | `DELETE /api/shifts/:id?deleteSeries=true` on 2nd shift (Sept 15) | Status `200 OK`<br>• Removes 2nd (Sept 15) and 3rd (Sept 16) shifts<br>• 1st shift (Sept 14) remains in DB |

---

## Part 3: Baseline Server & Error Suites
> Included for completeness of the entire test suite run (3 tests)

### 3.1 App Error Handling (`error.spec.ts`)
> File: [error.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/error.spec.ts)

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 41 | `should return 404 for not existing page` | [error.spec.ts:L5-L8](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/error.spec.ts#L5-L8) | `GET /fake-page` | Status `404 Not Found` |

### 3.2 Home Route Handling (`index.spec.ts`)
> File: [index.spec.ts](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/index.spec.ts)

| # | Test Case Title | Code Location | Input / Scenario | Expected Behavior |
|---|-----------------|---------------|------------------|-------------------|
| 42 | `should return 200 OK` | [index.spec.ts:L5-L8](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/index.spec.ts#L5-L8) | `GET /` | Status `200 OK` |
| 43 | `should return Welcome to Express` | [index.spec.ts:L10-L16](file:///Users/tanmaygarg/Documents/Projects/api-demo/src/test/index.spec.ts#L10-L16) | `GET /` | Returns HTML containing `"Welcome to Express"` |
