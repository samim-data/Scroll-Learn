# Deep Dive — Interactive Slides

> How the "Go Deeper" feature works in v3: from boring text wall to swipeable learning cards.

---

## v1 vs v3

| | v1 (current) | v3 (target) |
|---|---|---|
| Output | Markdown text in a bottom sheet | Horizontally swipeable slide deck |
| Input to AI | Title + description + channel name | Title + description + **full transcript** |
| Interactivity | Scroll to read | Swipe slides, tap quiz answers, expand mind maps |
| Cached as | `videos.deep_dive_text` (TEXT) | `videos.slide_json` (JSONB) |

---

## Slide types

### `summary`
The first slide. Big headline, short body, emoji.

```json
{
  "type": "summary",
  "title": "Quantum Entanglement",
  "body": "Two particles linked across any distance — measuring one instantly determines the state of the other. Einstein called it 'spooky action at a distance'.",
  "emoji": "⚛️"
}
```

**Renders as:** full-screen card with gradient background, large emoji, bold title, body text below.

---

### `concept`
A key term with a definition and a simple SVG icon.

```json
{
  "type": "concept",
  "term": "Superposition",
  "definition": "A quantum particle exists in multiple states simultaneously until it is measured. Like a coin spinning in the air — both heads and tails at once.",
  "svg_icon_name": "wave"
}
```

**Renders as:** term in large font, definition, SVG icon on the right. `svg_icon_name` maps to a local icon set.

---

### `mindmap`
A radial diagram showing relationships. Tappable nodes.

```json
{
  "type": "mindmap",
  "center": "Quantum Computing",
  "branches": [
    {
      "label": "Qubits",
      "children": ["Superposition", "Entanglement", "Decoherence"]
    },
    {
      "label": "Applications",
      "children": ["Cryptography", "Drug discovery", "Optimisation"]
    },
    {
      "label": "Hardware",
      "children": ["IBM Q", "Google Sycamore", "Photonic chips"]
    }
  ]
}
```

**Renders as:** SVG radial tree via `react-native-svg`. Tap a node to highlight its branch.

---

### `quiz`
One multiple-choice question. Tap to reveal the correct answer.

```json
{
  "type": "quiz",
  "question": "What makes a qubit fundamentally different from a classical bit?",
  "options": [
    "It processes faster",
    "It can only be 0",
    "It can exist in a superposition of 0 and 1",
    "It requires no power"
  ],
  "answer_index": 2,
  "explanation": "A qubit leverages superposition to represent both 0 and 1 simultaneously, exponentially expanding computational possibilities."
}
```

**Renders as:** question text, 4 tappable option cards. Tap reveals correct (green) / incorrect (red), then shows explanation.

---

### `timeline`
A sequence of historical events or conceptual steps.

```json
{
  "type": "timeline",
  "title": "Quantum Computing Milestones",
  "steps": [
    { "year": 1981, "event": "Richard Feynman proposes using quantum systems to simulate physics" },
    { "year": 1994, "event": "Peter Shor publishes quantum factoring algorithm" },
    { "year": 2019, "event": "Google claims 'quantum supremacy' with Sycamore processor" },
    { "year": 2023, "event": "IBM reaches 1000+ qubit processor" }
  ]
}
```

**Renders as:** vertical SVG timeline with year markers and event labels.

---

### `related`
The final slide. Tappable topic cards that open a search for that topic.

```json
{
  "type": "related",
  "topics": [
    { "title": "String Theory", "category": "science", "query": "string theory explained simply" },
    { "title": "Schrödinger's Cat", "category": "science", "query": "schrodinger cat paradox" },
    { "title": "Quantum Cryptography", "category": "tech", "query": "quantum cryptography explained" }
  ]
}
```

**Renders as:** horizontal row of cards, each with category colour. Tap → navigates to search screen with pre-filled query.

---

## Full example payload

```json
{
  "slides": [
    { "type": "summary", "title": "Quantum Entanglement", "body": "...", "emoji": "⚛️" },
    { "type": "concept", "term": "Superposition", "definition": "...", "svg_icon_name": "wave" },
    { "type": "mindmap", "center": "Quantum Computing", "branches": [...] },
    { "type": "quiz", "question": "...", "options": [...], "answer_index": 2, "explanation": "..." },
    { "type": "timeline", "title": "Milestones", "steps": [...] },
    { "type": "concept", "term": "Decoherence", "definition": "...", "svg_icon_name": "collapse" },
    { "type": "related", "topics": [...] }
  ],
  "cached": false
}
```

Target: **5–7 slides per video**.

---

## Backend — `services/slideGenerator.js`

The LLM is instructed to return only valid JSON. The service validates the schema before caching.

**Prompt structure:**

```
You are an expert educator building interactive learning slides.

Video Title: {title}
Channel: {channel}
Transcript: {transcript[:2000] or description if no transcript}

Return ONLY valid JSON with no markdown, no commentary.

Schema:
{
  "slides": [
    // 5–7 items, mix of types: summary, concept, mindmap, quiz, timeline, related
    // Always start with summary. Always end with related.
    // Include exactly 1 quiz slide.
    // Include 1 mindmap if the topic has clear relationships.
  ]
}

Allowed types and their required fields:
  summary   → title(str), body(str), emoji(str)
  concept   → term(str), definition(str), svg_icon_name(str)
  mindmap   → center(str), branches([{label, children:[str]}])
  quiz      → question(str), options([str] len 4), answer_index(int), explanation(str)
  timeline  → title(str), steps([{year(int), event(str)}])
  related   → topics([{title(str), category(str), query(str)}])
```

**Caching:**

On first request → generate → store in `videos.slide_json`.  
All subsequent requests → return cached JSON instantly (no LLM call).

---

## Frontend — `SlideSheet` component (Expo)

```
SlideSheet (react-native-bottom-sheet)
  └─ FlatList horizontal pagingEnabled
       ├─ slide 0  →  SummarySlide
       ├─ slide 1  →  ConceptSlide
       ├─ slide 2  →  MindMapSlide      (react-native-svg)
       ├─ slide 3  →  QuizSlide         (stateful — tracks answer)
       ├─ slide 4  →  ConceptSlide
       ├─ slide 5  →  TimelineSlide     (react-native-svg)
       └─ slide 6  →  RelatedSlide
  └─ Pagination dots  (animated, one per slide)
```

Each slide is full-screen within the sheet.  
Swipe left/right to navigate.  
`MindMapSlide` and `TimelineSlide` use `react-native-svg` for graphics.  
`QuizSlide` keeps local state for selected answer (does not persist).

---

## Colour scheme per slide type

| Type | Background | Accent |
|---|---|---|
| `summary` | Deep blue gradient | White |
| `concept` | Dark purple | Soft yellow |
| `mindmap` | Dark teal | Cyan nodes |
| `quiz` | Dark navy | Green (correct) / Red (wrong) |
| `timeline` | Charcoal | Orange markers |
| `related` | Black | Category colour per card |
