# Portfolio Project Content — Mark Lu

Format per project:
1. Name  2. Short intro (20–35 words)  3. Core tech (badges)  4. Full stack  5. What the tech achieved  6. Live link  7. Screenshot ideas

---

## 1. FocusFlow — Full-Stack Focus Platform

**2. Intro**
A full-stack focus-timer platform that helps people work in structured sessions and track their productivity over time — available as both a web app and a browser extension.

**3. Core tech (badges)**
React / Next.js · NestJS · Go · AWS · Docker · CI/CD

**4. Full stack**
TypeScript, NestJS (write API), Go (read-heavy analytics service), Next.js / React, PostgreSQL, Caddy (reverse proxy + auto-HTTPS), Docker & Compose, GitHub Actions, AWS EC2, Chrome MV3 extension, JWT auth.

**5. What the tech achieved**
Split writes (NestJS) from read-heavy analytics (Go) so each service scales on its own. An API-first backend powers both the Next.js web app and the browser extension, so adding a new client needs zero backend change. Stateless JWT auth removed the session store; one-push CI/CD (GitHub Actions) builds in CI so even a small EC2 host ships reliably; Caddy fronts the stack with automatic HTTPS.

**6. Live link**
https://pomodoro.marklu.page

**7. Screenshot ideas**
- The live timer / focus-session screen
- The analytics / stats dashboard (daily productivity)
- The Chrome extension popup

---

## 2. Real-Time Automation & Monitoring Service

**2. Intro**
A 24/7 automation service that ingests a live event feed, processes every event reliably, and continuously monitors its own health to surface incidents within seconds.

**3. Core tech (badges)**
Python · Docker · Prometheus · Grafana · CI/CD

**4. Full stack**
Python, Docker & Compose, Nginx, Prometheus, Grafana, PostgreSQL, GitHub Actions, Linux VPS. Monitoring-as-code (dashboards, alerts, routing version-controlled).

**5. What the tech achieved**
Guarantees exactly-once processing across restarts using database-level idempotency, so no event is lost or double-counted. Raised request success rate from 71% to 99.7% by reverse-engineering a hidden upstream API rule from structured logs. Cut incident detection from hours to under 90 seconds with Prometheus/Grafana alerting that fires even on a crash, and automates safe releases behind an 85-test gate.

**6. Live link**
Private service (no public UI) — architecture walkthrough / Grafana dashboards available on request.

**7. Screenshot ideas**
- The Grafana monitoring dashboard (metrics + alert panels)
- An architecture diagram: ingest → process (idempotency) → PostgreSQL → Prometheus/Grafana

---

## 3. VLM Fine-Tuning & LLM-as-Judge Pipeline (ArtCom)

*(University research collaboration — team of 8.)*

**2. Intro**
A research pipeline that fine-tunes a vision-language model to describe images faithfully, paired with an automated "LLM-as-judge" system that measures how trustworthy those descriptions really are.

**3. Core tech (badges)**
Python · PyTorch · LoRA · vLLM · LLM-as-judge

**4. Full stack**
Python, PyTorch, LLaMA-Factory, vLLM, LoRA fine-tuning, Qwen3-VL, custom LLM-as-judge benchmark (ArtcomBench), human-in-the-loop validation.

**5. What the tech achieved**
LoRA fine-tuning produced a model that beat all three baselines — including a 2025 state-of-the-art model — on every faithfulness metric. Built ArtcomBench to make AI-output quality measurable and reproducible, and validated 3,500 AI-generated labels against human raters (ICC 0.82) before training. Delivered these results training on a single GPU in under 3 hours.

**6. Live link**
Public monorepo (GitHub) — github.com/Marklu0509 *(add exact repo link)*. No live demo.

**7. Screenshot ideas**
- Benchmark comparison chart (baselines vs fine-tuned across metrics)
- An example image with faithful vs hallucinated caption side-by-side

---

## 4. Myopia Progression Prediction — Clinical ML

**2. Intro**
A clinical decision-support tool that models how a child's short-sightedness may progress from only their first few months of data, giving clinicians an explainable early signal.

**3. Core tech (badges)**
Python · XGBoost · SHAP · Streamlit

**4. Full stack**
Python, scikit-learn, XGBoost, SHAP, Streamlit, pandas. De-identified clinical data; leakage-safe pipelines.

**5. What the tech achieved**
Benchmarked six models under leave-one-out cross-validation with leakage-safe pipelines, and engineered clinically-grounded features that a purely technical modeler would miss. Used SHAP to confirm the model's logic matched established optometry theory, earning clinician trust, and shipped it as a live decision-support tool that turns model outputs into actionable insight. Patient-data de-identification is built into the pipeline.

**6. Live link**
https://marklu-myopia.streamlit.app

**7. Screenshot ideas**
- The prediction input + result screen
- The SHAP explanation chart (feature contributions)
- The growth-trajectory chart

---

## 5. Cloud Architecture & Serverless Pipeline (ImageApp)

**2. Intro**
A cloud image-processing system that scales with demand — pairing always-on web servers with an event-driven serverless pipeline that processes uploads on demand without paying for idle capacity.

**3. Core tech (badges)**
AWS · CloudFormation · Serverless · Python

**4. Full stack**
AWS (EC2, ALB, Auto Scaling, S3, EventBridge, Lambda, RDS, IAM, Secrets Manager, CloudWatch), CloudFormation (infrastructure-as-code), Python.

**5. What the tech achieved**
A hybrid architecture pairs an auto-scaling EC2 + ALB tier with a serverless S3 → EventBridge → Lambda pipeline, so neither steady nor bursty load pays for idle compute — proven under ApacheBench load testing. The whole stack is defined as code in CloudFormation so it's reproducible and safe to change, and the data tier is hardened with private-subnet RDS, least-privilege IAM, and runtime secrets from Secrets Manager.

**6. Live link**
None (personal project; infrastructure torn down) — GitHub / architecture diagram.

**7. Screenshot ideas**
- The AWS architecture diagram (EC2+ALB tier + S3→EventBridge→Lambda)
- A CloudWatch graph showing auto-scaling under load

---

## 6. Distributed E-Commerce Microservices Platform

*(Team project — 4 developers.)*

**2. Intro**
A distributed e-commerce backend where independent services (store, bank, delivery, email) coordinate a single order reliably over messaging, staying consistent even when individual services fail.

**3. Core tech (badges)**
Java · Spring Boot · RabbitMQ · PostgreSQL · React

**4. Full stack**
Java 17, Spring Boot, Spring Data JPA / Hibernate, PostgreSQL, RabbitMQ, React, TypeScript.

**5. What the tech achieved**
Four services communicate purely over RabbitMQ so one slow service can't block the rest. A transactional outbox guarantees zero message loss through broker outages, idempotent handlers prevent customers being double-charged, and the Saga pattern keeps orders consistent across services by auto-rolling-back stock and payment on failure. Row-level locks stop stock overselling without throttling store throughput.

**6. Live link**
None — GitHub repo *(add link)*.

**7. Screenshot ideas**
- Architecture / message-flow diagram (4 services + RabbitMQ)
- The React storefront checkout
- A Saga rollback sequence diagram

---

### Suggested display order (strongest / most visual first)
1. FocusFlow (live, full-stack, visual) → 2. Myopia (live, healthcare, visual) → 3. VLM (impressive AI result) → 4. Pcopbot (SRE/reliability) → 5. ImageApp (cloud/AWS) → 6. E-Commerce (distributed systems).
*(For the Apartments.com.au application, move FocusFlow first — its TS/NestJS/Next.js/AWS stack matches theirs almost exactly.)*
