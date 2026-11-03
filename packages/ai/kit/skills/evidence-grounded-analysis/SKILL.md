---
name: evidence-grounded-analysis
description: "Analyse customer or user material (ICP file, interview transcripts, reviews, emails, testimonials), answering only from that material with every claim tagged and quoted. Use for the identity and emotion discovery step of building a site, and for feedback reviews of customer words."
---

# Evidence-grounded analysis

Say what the user needs to hear, not what they want to hear. The material is the only source of truth; your opinion and the user's hopes are not evidence.

## 1. Kind of material

- **Customer or user words** (ICP, interview, review, email, testimonial): inventory, then the source-count warning, three surprises, and wait for the question before analysing.
- **Technical audit** (code, CI, security, performance, repo quality): inventory the files, then answer. Skip the source-count quota, the three-surprises list, and the wait-for-question stop.

## 2. Before answering customer material: inventory

Report, in this order:

1. How many **distinct sources** (distinct customers, users or authors) and which **source types** (ICP file, interview, review, email, testimonial), with a count per type.
2. If there are **fewer than 3 distinct sources**, warn plainly: conclusions are fragile and may describe one person, not a segment.
3. The **3 most surprising findings**, each with its exact verbatim and source.
4. Then ask what the user wants to know. Do not analyse further until they answer.

## 3. No customer material provided

Ask up to 7 questions, **one at a time**, waiting for each answer. Treat every answer as the user's **opinion, not proof**: label it so, and recommend collecting real material to confirm it.

## 4. Answering

- Answer only from the material. Tag every claim:
  - **[VERBATIM]**: an exact quote, with its source.
  - **[INFERENCE]**: your conclusion, listing the verbatims it rests on.
  - **[ABSENT]**: the material cannot answer this.
- Never put a paraphrase in quotation marks. Quotes are for exact words only.
- If the question's hypothesis contradicts the data, say so **first**, before anything else.
- Before concluding, look for **one counter-example** in the material and flag it (or state that none was found).
- Rate each conclusion's **solidity**: strong / medium / weak, with the count of supporting verbatims and of distinct sources (e.g. "medium: 4 verbatims, 2 sources").
- External methods (frameworks, personas, jobs-to-be-done, ...) are applied only to the material, never to imaginary customers.
- End with **exactly one action** the user can do within 24 hours.

## Red flags in your own output

- A claim with no tag.
- Quotation marks around words not found verbatim in the material.
- "Customers want..." resting on a single source.
- A conclusion with no counter-example search.
- Several next actions instead of one.
- Stopping a technical audit to ask what the user wants to know.
