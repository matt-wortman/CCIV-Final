# Tech Triage Form – Refactor Explained in Plain English

Audience: Non‑technical teammates (e.g., scientists, clinicians, product owners) who care about data quality, reproducibility, and smooth user experience.

Date: October 7, 2025

---

## Why are we changing anything?

Right now the app “works,” but several pieces are tightly tied together. That makes it harder to add features like reliable autosave, better error messages, and robust analytics without risking side effects elsewhere. Think of a lab instrument that has the pump, sensor, and software fused into one box—you can’t upgrade one part without opening the whole thing.

We’re restructuring so each part has a clear role and a clean hand‑off to the next. This is the same principle as good data management: standard names, defined formats, and repeatable procedures.

---

## What are we changing (in everyday terms)?

1) A single “data dictionary” for the form
- Today different screens assume slightly different shapes for the data.
- We’ll create one shared specification (like a data dictionary + validation rules). Everyone—screens, calculations, and the database—will use the same definitions.

2) A dedicated “workflow controller” for the form
- Instead of each screen managing its own memory, we’ll centralize it. Picture a study coordinator tracking where each participant is in a protocol and what fields they’ve filled in.
- This controller also handles autosave and “where you left off.”

3) Smaller, clearer screens
- Some screens currently mix instructions, tables, and calculations all in one chunk. We’ll split those into smaller building blocks: a table component, a scoring component, and so on—like separate reusable lab modules.

4) Calculations that live outside the user interface
- The math that turns answers into scores will be moved into a neutral place (a standard operating procedure anyone can run—UI, API, or reports).

5) Quality checks at the edges
- The shared data dictionary will include validation rules. Submissions will be checked against the rules before saving, so the database never stores “off‑protocol” data.

---

## What benefits will you see?

- Fewer surprises: The same rules apply whether you view, save, or export—because they all read the same spec.
- Better autosave: Edits persist quickly and consistently because the controller coordinates timing and errors.
- Clearer error messages: If something is missing, the app will highlight exactly which field and section need attention.
- Easier iteration: New sections or fields can be added once (in the data dictionary) and show up everywhere correctly.
- Reuse of the math: Scoring can run in exports, dashboards, or API endpoints without the UI needing to be involved.

---

## What won’t change?

- The visible questions and workflow remain familiar.
- Previously entered data remains valid; we’re improving how it is defined and checked, not changing its meaning.
- Hosting and security do not change because of this refactor.

---

## How we’ll do this (high level)

Phase A — Define the source of truth
- Create a shared “form schema” file that lists every field, type, and rule.
- Connect screens, calculations, and database to that schema.

Phase B — Centralize the workflow
- Move navigation, progress, and autosave into a single controller so all sections behave the same way.

Phase C — Right‑size complex screens
- Split big composite screens into smaller pieces (e.g., “Competitor Table”, “Scoring Matrix”, “Impact vs Value chart”).

Phase D — Isolate the math
- Put all scoring formulas into a neutral module. The user interface calls that module, and so can reports and APIs.

Phase E — Strengthen validation + submissions
- Use the shared rules to validate before saving or submitting. Show targeted messages and scroll the user directly to the first missing item.

---

## Risks & how we mitigate them

- Risk: Breaking something while rearranging parts.
  - Mitigation: Change in small steps; add checks and simple tests for the math and the form workflow as we go.

- Risk: Confusion for users during the transition.
  - Mitigation: Keep screens visually familiar; improvements (autosave, clearer errors) are additive, not disruptive.

---

## What does success look like?

- A single place defines all fields and rules.
- The app tells you exactly which field is missing and jumps there.
- Scores match across UI, exports, and any backend use of the same formulas.
- Adding a new field involves updating the schema and minimal screen code—no hunting across files.

---

## FAQ (for non‑developers)

Q: Will this change the questions we ask?  
A: No. It standardizes how we define and validate them.

Q: Will data we’ve already collected be safe?  
A: Yes. We’re improving structure, not deleting or changing meaning.

Q: Does this delay feature work like exports or analytics?  
A: It should speed those up, because scoring and rules will be reusable everywhere.

Q: Will autosave get better?  
A: Yes. It will be coordinated centrally, so it’s more reliable and less likely to miss edits.

---

## One‑page summary you can share

We’re reorganizing the triage form like a well‑run lab protocol: a single data dictionary, a clear workflow controller, reusable modules for complex screens, and calculations that live outside the UI. This improves reliability, makes autosave and error messages clearer, and lets us reuse the same scoring math in exports and APIs. The questions won’t change—only the internal structure does—so we can add features faster with less risk.

