# Plain-English Summary: Technology Multi-Form Master Plan

## What We’re Building
- A single “Technology” record that holds everything we know about an invention.
- Stage-specific add-ons (Triage, Viability, etc.) that plug into that Technology record.
- A reusable question catalog so form fields are defined once and reused across stages.
- Forms that prefill information from earlier stages, carry it forward, and only ask for new data.
- Persona-based views so an inventor, tech manager, or executive sees the same data but with different emphasis.

## Why We Chose This Approach
1. **Stop retyping the same data**  
   Inventor names, reviewers, and core technology facts live in one place. Every form references that source instead of copying it.

2. **Keep forms easy to change**  
   Questions are stored in a catalog. Change the wording or validation once and every form that uses that question updates automatically.

3. **Handle multiple stages without chaos**  
   Each stage has its own supplement table. We can add a new stage later by adding another supplement without touching the core Technology record.

4. **Support different personas without duplicate tables**  
   Instead of creating separate forms or spreadsheets for managers vs. executives, we show the same data and filter it by persona rules.

5. **Enable clean migrations and auditing**  
   We have a clear plan for moving current Triage data into the new structure, tracking every change, and rolling back if needed.

6. **Reduce bugs and data conflicts**  
   Optimistic locking (rowVersion fields) ensures two people can’t overwrite each other’s changes. Audit trails record exactly who changed what.

7. **Set us up for future growth**  
   The architecture supports calculated metrics, integrations, staged rollouts, and future auth upgrades without redesigning everything.

## How We’ll Execute (High Level)
1. Add the new tables/columns and populate the question catalog.
2. Migrate existing Triage data into the Technology + TriageStage structure.
3. Update the form engine to use the catalog, prefill values, and enforce persona rules.
4. Build Viability forms off the same catalog so the triage data flows forward automatically.
5. Add calculated metrics, audit tools, and dashboards once the core flow is stable.

## What Success Looks Like
- Creating a new Viability assessment is a single click from the Triage record.
- No one re-enters inventor or reviewer info—forms prefill automatically.
- Personas see the right information without custom reports.
- Audit reports show a full change history for any field.
- Adding a new form stage or persona only requires configuration, not schema surgery.

This summary is meant to explain the “why” and “what” in plain terms. The full `TECHNOLOGY_MULTI_FORM_MASTER_PLAN.md` contains all technical details for engineers to reference while they implement.

