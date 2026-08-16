# Decisions

| Decision | Rationale |
| --- | --- |
| FastAPI financial engine | Keeps calculations server-side, testable, and deterministic. |
| No forced auth in demo | Users see value before account creation. |
| Rule-first categorization | Saves LLM credits and keeps routine imports predictable. |
| Demo data in API | Gives the frontend one realistic contract immediately. |
