# Product Discovery — FEAT-21 frontend batch 2 polish

## Problem

Operators encounter selection controls without a matching bulk action, inconsistent dark toast styling, native browser confirmation dialogs, and incomplete role creation/account menu affordances. Required fields and click targets also need consistent accessible visual cues.

## Evidence and audience

The user supplied eight concrete acceptance areas covering Users, Roles, Logs, Sessions, account navigation, feedback and shared styling. Existing UI source and tests are the implementation evidence; baseline metrics are NOT FOUND.

## Hypothesis and success

Removing misleading controls and making destructive actions, role selection and account navigation consistent will reduce interaction ambiguity. Success is the requested focused component/page tests plus full test, typecheck, lint and format gates passing.

## Constraints

No API changes, no changes to can/RBAC guards or existing handlers, preserve accessible labels/tooltips and loading/error feedback, no native confirm/alert in production source. No PR or merge. Separate GitHub issue: NOT FOUND; gh is unavailable in this environment.
