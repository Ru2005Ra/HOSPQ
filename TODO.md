# Unified Login Form — Task Plan

## Steps

### Step 1: Update `src/lib/store.ts`
- [x] Modify `registerPatient` to accept `username` field (required, unique)
- [x] Add unified `login(username, password)` that finds any user (patient or staff) by username+password
- [x] Add unified `resetPassword(username, firstName, lastName, newPassword)` for both patients and staff
- [x] Keep backward compatibility by removing old `loginPatient`, `loginStaff`, `resetPatientPassword`, `resetStaffPassword` or updating references

### Step 2: Update `src/lib/i18n.ts`
- [x] Add new i18n keys: `forgot_password`, `new_to_hospiq`, `create_account_link`, `username_placeholder`, `or_text`

### Step 3: Rewrite `src/routes/auth.tsx`
- [x] Single unified login form (username + password)
- [x] "Forgot password?" link → unified forgot password form
- [x] "Create new account" link → registration form (with username field)
- [x] After login, auto-route to dashboard based on `user.role`

### Step 4: Update `src/routes/about.tsx`
- [x] Update step1_d text to reflect unified username login

### Step 5: Build verification
- [x] Run `npm run build` — client build succeeded (✓ built, multiple runs), SSR build transformed modules successfully. No errors from the unified login changes.
