# Tech Triage Builder Walkthrough for Non-Technical Coordinators

> **Persona:** *Avery*, a clinical program coordinator who understands the evaluation process but does not code. Avery’s goal is to design, publish, and share a technology triage form that captures consistent data across teams.

This tutorial holds your hand from the moment you start planning a form to the point where teams complete submissions and you download polished PDF reports. You only need a computer, an internet connection, and access to the Tech Triage Builder. Everything happens in your web browser.

---

## 1. Think Through Your Form Before Touching the Builder

Start with the outcome you want. Use the questions below to organize your thoughts:

1. **Who will fill out this form?** (Inventors, clinicians, analysts?)  
   Jot down their names or roles so you can tailor instructions.
2. **What decisions will the form support?**  
   Are you deciding whether to invest, prioritize, or schedule a review meeting?
3. **What information is non-negotiable?**  
   For example, Technology ID, contact details, strategic alignment, and market evidence.
4. **What evidence helps compare submissions?**  
   Scores, attachments, links, competitor lists—note these so they have a home in the form.

> **Tip:** Sketch the form on paper in sections (Header → Alignment → Market). Having a simple outline keeps the builder session focused.

---

## 2. Sign In and Open the Builder

1. Open your browser and go to the Tech Triage Builder URL (for example, `https://tech-triage-app.azurewebsites.net/dynamic-form/builder`).
2. If prompted, enter the shared username/password provided by your admin.
3. The landing page shows:
   - A header with shortcuts back to the live form and home page.
   - A **Create New Template** card.
   - A list of **Existing Templates** with their status (draft, published, updated date).

---

## 3. Create a New Draft Template

1. In the **Create New Template** card, fill in:
   - **Template Name**: e.g., “FY26 Digital Health Intake”.
   - **Description**: Short sentence about how reviewers should use it.
   - **Version**: Start with `1.0.0`; you can update later.
2. Click **Create Template**. You’ll be taken to the builder workspace for that draft.

### What You See in the Workspace
- **Sections column** on the left with “Header & Identifiers”, “Strategic Alignment”, etc.
- **Section Details** in the middle showing questions, edit buttons, and rearrange controls.
- **Preview toggle** at the top to see the form as submitters will.

---

## 4. Tailor Sections and Questions

You can edit existing questions, duplicate them, or add new ones.

### Edit a Question
1. Hover over a question card and choose **Edit**.
2. Update the label (what people read) and the help text (short guidance below the field).
3. If the question should be required, switch on **Required**.
4. Save and close to return to the section view.

### Add a New Question
1. In the section where you want the question, click **Add Field**.
2. Choose a field type (short text, dropdown, score, repeatable table, etc.).
3. Give it a clear label.
4. Add guidance using plain instructions (“Explain how this technology improves patient safety”).

### Build a Data Table (formerly Repeatable Group)
Use a **Data Table** when you want to capture several related fields per row (competitors, SMEs, milestones, etc.).
1. Add a **Data Table** field.
2. In the configuration modal, describe each column:
   - Enter the column label (e.g., “Company”, “Product or Solution”).
   - Choose the input type (`Text`, `Paragraph`, or `Number`).
   - Toggle **Required** if the column must be completed on every row.
   - The database key auto-fills using underscores (e.g., `company_name`); it’s read-only so data stays consistent.
3. Set **Minimum rows** (how many entries must remain) and **Maximum rows** (optional cap). Leave max blank for “unlimited.”
4. Click **Add column** to insert more columns (limit of 8); use the trash icon to remove extras (at least one column is required).
5. Save the field. In the live form, submitters see the configured table and can add rows until the maximum is reached.

> **Need predefined rows with checkboxes?** Choose **Data Table with Selector** instead. You’ll enter the stakeholder list once, and submitters simply check the relevant rows and add benefit notes.

> **Dropdown tip:** When configuring dropdowns, the second column shows the database value (auto-slugged with underscores). These stay read-only so labels can change without breaking stored data.

> **Design Tip:** Keep sections short. If a section has more than 6–7 questions, consider splitting it into two.

---

## 5. Preview the Submitter Experience

1. Toggle **Preview Mode** at the top of the page.
2. Walk through the form as if you were submitting it. Check:
   - Do instructions make sense?
   - Are required fields clearly marked?
   - Do conditional questions show/hide at the right moments?
3. Toggle back to **Edit Mode** to adjust anything you notice.

---

## 6. Save Drafts and Publish

- **Save Draft:** Use the **Save Draft** button to capture your progress. You can revisit and edit any time.
- **Publish Template:** When you’re confident, click **Publish Template**. Published templates appear to anyone visiting `/dynamic-form`.
- **Versioning:** If you need changes later, duplicate the template, edit the copy, and bump the version number to keep history.

---

## 7. Test the Live Form

1. Visit `/dynamic-form` (link is in the builder header).
2. Complete the form as a test submission. Use mock data.
3. Verify that saving a draft works (click “Save Draft”) and that loading the draft restores your answers.
4. Submit the test form. You’ll be redirected to a list of your submissions and drafts.

---

## 8. Export a Report as PDF

Once a draft or submission exists, you can download a polished report.

### Option A: From the Form (current session)
1. While filling out the form, click **Export PDF** in the navigation bar.
2. The system downloads a report containing every question, your answers, and the scoring visuals at the end.

### Option B: From a Saved Submission
1. Go to `/dynamic-form/drafts` and open the submission you want.
2. Click **Export PDF**. You’ll receive the same report, perfect for sharing or printing.

**Report Contents**
- Cover section with technology details and status.
- Numbered list of questions with responses (repeatable tables become tidy lists).
- Scoring matrix and impact vs value quadrant on a separate page.

---

## 9. Publish or Share the Form

- **Internal Distribution:** Send the `/dynamic-form` URL to your team. Mention any login details if basic auth is enabled.
- **External Users:** Coordinate with IT if you need guest access or a public version.
- **Reminders:** Encourage users to save drafts, especially for longer forms.

---

## 10. Maintain the Form Over Time

- **Update Content:** Duplicate the template, apply edits, and publish the new version. Retire older versions if not needed.
- **Review Submissions:** Use the drafts/submissions list to monitor progress.
- **Archive PDFs:** Store important submissions in your team’s document repository.

---

## 11. Troubleshooting Checklist

| Symptom | Quick Fix |
| --- | --- |
| I can’t reach the builder page | Confirm you’re on the VPN (if required) and logged in with the shared credentials. |
| A field disappeared unexpectedly | Check if it has conditional logic tied to another answer (edit the question to review). |
| PDF download spins forever | Refresh the page and try again; if the issue persists, contact IT with the time and template name. |
| Published form still shows old questions | Clear your browser cache or open in a private window; if still outdated, verify you published the latest template version. |

---

## 12. Need Help?

- **For content questions:** Reach out to the Tech Triage program lead.
- **For technical issues:** Email the platform engineering team with the template name, time of issue, and any screenshots.
- **For new feature ideas:** Document them and share during the monthly triage sync.

With this guide, Avery—and you—can plan, build, publish, and report on technology triage forms without touching code. Happy form building!
