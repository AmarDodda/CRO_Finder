# CRO Finder

## The Story

Imagine you’re a **pharma sponsor** about to start a new clinical trial.  
You need to find the right **Contract Research Organization (CRO)** to run your study.  

But here’s the challenge:  
- The CRO world is **fragmented**.  
- You spend weeks searching, comparing, and reaching out.  
- You still aren’t sure if the CRO you picked is the best fit.  

That’s the pain point this project solves.  

---

## The Goal

The goal of the **CRO Finder** is simple:  
- Let sponsors **submit a project description**.  
- Automatically **match them with the CROs** whose expertise, specialties, and track record align the best.  
- Show **not just who matched, but why they matched** — with clear rationale and similarity scores.  

No more manual searching. No more uncertainty. Just fast, AI-driven CRO discovery.  

---

## How It Works (Step by Step)

1. **Sponsor enters a project.**  
   Example: “Phase II Oncology trial focusing on rare cancers.”  

2. The system **converts that text into an embedding** — a numerical representation of the project — using the **Hugging Face model [`BAAI/bge-small-en-v1.5`](https://huggingface.co/BAAI/bge-small-en-v1.5)**.

3. All CRO profiles are **already stored as embeddings** in the database.  

4. A **vector similarity search** (pgvector in PostgreSQL) finds CROs closest to the project in meaning.  

5. The system **returns a ranked list** with:  
   - CRO name and website  
   - Contact email  
   - Specialties and country  
   - Similarity score  
   - Rationale for the match  

6. The sponsor sees the results instantly on the Matches page.  

7. Sponsors can **start a built-in conversation with CROs** directly through the platform, making the process more interactive and collaborative from the start.  

---

## How This Tool Can Be Helpful

- **If you’re a Sponsor** → Submit your project → See your top CRO matches → **Start a conversation right away** to explore collaboration.  
- **If you’re a CRO** → Build your profile → Get discovered by sponsors → **Engage in direct conversations** to speed up decision-making.  
- **If you’re curious** → Explore the results → Notice how the rationale and messaging feature make the process transparent and interactive.  

---

## Tech Behind the Scenes

- **Frontend:** Next.js + TailwindCSS  
- **Backend:** Next.js API Routes (Node.js + TypeScript)  
- **Database:** Supabase (Postgres + pgvector extension)  
- **AI Layer:** Hugging Face Embeddings (BAAI/bge-small-en-v1.5)  
- **Deployment:** Vercel (Frontend/API) + Supabase Cloud (Database)  

---

## Picture the Experience

You submit your project.  
Seconds later, you see something like this:  

| CRO Name        | Country | Similarity | Specialties         | Rationale                                  |
|-----------------|---------|------------|---------------------|--------------------------------------------|
| ABC Research    | USA     | 91%        | Oncology, Rare Diseases | Strong oncology focus and Phase II expertise |
| GlobalTrials Ltd| UK      | 87%        | Cardiovascular, Metabolism | Prior experience with similar studies       |

Clear. Transparent. Actionable. Interactive.  

---

## Existing Features

- AI-powered **project-to-CRO matching** using embeddings + vector search.  
- **Explainable matches** with rationale and similarity scores.  
- **Built-in messaging** between Sponsors and CROs for direct communication.  

---

## What’s Next

- Smarter filters (budget, location, therapeutic areas).  
- Dashboards to compare CROs across multiple projects.  
- Integration with external systems like **Veeva Vault** or **StudyTeam**.  

---

## Closing Note

The CRO Finder is about one thing:  **Making the CRO selection process faster, smarter, and evidence-driven.**

Instead of spending weeks searching, sponsors can find and connect with their best CRO partners — and start conversations — in seconds.  
