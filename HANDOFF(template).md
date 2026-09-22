# HANDOFF

> Purpose: pass context between Claude chat and Claude Code.
> At the end of a session, add a new dated entry at the top and keep it short (under one page). Once you have 3–4 entries, fold the oldest into a one-line summary at the bottom so the file doesn't grow forever.

**Date:**
**From:** Chat / Claude Code
**To:** Claude Code / Chat
**Project:**

---

<!-- Copy the block below for each new session. Newest entry goes on top. -->


## 1. Goal
One or two sentences: what are we trying to achieve right now?

## 2. Current state
- What works:
- What's broken or unfinished:
- Files/folders touched (paths):

## 3. Decisions made (and why)
- Decision — reason
- Decision — reason

## 4. Things we tried that did NOT work
- Attempt — why it failed (so nobody repeats it)

## 5. Next steps (in order)
1.
2.
3.

## 6. Constraints & conventions
- Stack/versions:
- Style rules (naming, state management, folder structure):
- Do not touch:

## 7. Open questions
- Question — who needs to answer

## 8. Attachments / references
- Files, links, error messages, screenshots (paste the key ones below)

<!-- Older entries, folded to one line each, go here once the file gets long:
- 2026-09-10 — Set up auth flow, decided on JWT over sessions
-->

---

# Copy-paste prompts

**End of a chat session (ask Claude in chat):**
> Fill in a new dated HANDOFF.md entry from this conversation, for Claude Code. Be concise. Include exact file paths, decisions with reasons, and what failed. Output it as a single markdown block I can paste in at the top of the file.

**Start of a Claude Code session:**
> Read HANDOFF.md (top entry = most recent) and CLAUDE.md first. Summarize the goal and next steps in 3 lines, then start on step 1.

**End of a Claude Code session:**
> Add a new dated entry at the top of HANDOFF.md: what changed (files), what's working, what's broken, decisions made, and next steps. Keep it under one page. If there are more than 4 entries, fold the oldest into a one-line summary at the bottom.

**Start of a chat session (paste the file, then say):**
> Here's my HANDOFF.md from Claude Code — top entry is the latest. Continue from it. Help me with: ...

---

# CLAUDE.md starter (permanent context; changes rarely)

```
# Project
Name / one-line description

# Stack
Languages, frameworks, versions

# Conventions
Naming, folder structure, state management, testing

# Commands
How to run, test, build

# Current priorities
Top 3 goals (update when they change)

# Rules
- Read HANDOFF.md (top entry) at the start of every session.
- Add a new dated entry to the top of HANDOFF.md before ending a session.
```
