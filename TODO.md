# TODO

- [x] Update `/manager` staff form UI to allow manager to set doctors' treated department(s).
- [x] Ensure edits prefill selected departments.
- [ ] Ensure doctor list table shows departmentCodes.
- [ ] Lint/build verification (pre-existing project-wide TS errors remain, unrelated to this task).

## Task: Add reception vitals validation ✅

- [x] Add reusable `validateVitals` helper in `src/lib/store.ts`.
- [x] Refactor `EditModal.save()` in `reception.tsx` to use the shared helper.
- [x] Enforce valid vitals before a patient can be passed to the doctor.
- [x] Harden `vitalsFor()` rendering against missing vitals.
- [x] Add `vitals_required_before_pass` i18n key in both `en` and `rw`.
- [x] Type-check / build verification.

