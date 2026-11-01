# TestMocker – Digital Mock Test Platform

TestMocker is a full-stack mock examination platform designed for competitive exam preparation. It allows students to upload question papers, generate timed mock tests, evaluate their performance, and receive AI-assisted learning support.

Built using **Next.js, FastAPI, MongoDB, and OpenAI GPT-4o**, the platform also supports mentor-created tests and student assignments.

## Features

### Student Features
- **PDF-Based Mock Tests:** Upload question paper PDFs and create customized mock examinations.
- **Timed Examinations:** Attempt tests with configurable durations, question counts, and marking schemes.
- **Automated Evaluation:** Calculate scores with positive and negative marking, supporting MCQ, numeric, and text answers.
- **Performance Analytics:** View scores, correct and incorrect answers, and time spent per question.
- **Learning Mode:** Get AI-generated hints to understand questions without revealing their answers.
- **Topic Analysis:** Analyze question papers and visualize topic-wise question distribution.

### AI-Powered Features
- **Answer Key Extraction:** Use OpenAI GPT-4o to extract correct answers from question papers and answer key PDFs.
- **Scanned PDF Support:** Use PyMuPDF to extract text and render scanned PDF pages as images for vision-based processing.
- **Topic Classification:** Automatically classify questions into topics using AI.
- **AI-Assisted Hints:** Generate contextual hints from question images using GPT-4o.
- **Custom API Keys:** Users can configure their own OpenAI API keys, which are encrypted before storage.

### Mentor Features
- Create reusable test templates from uploaded question papers.
- Assign tests to individual students.
- Track recommended and attempted tests.

## Tech Stack

| Component | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| Database | MongoDB, Motor |
| PDF Processing | PyMuPDF |
| AI Integration | OpenAI GPT-4o API |
| Authentication | JWT, PyJWT, BCrypt |
| Visualization | Recharts |
| Containerization | Docker, Docker Compose |

## Architecture

The application follows a frontend-backend architecture:

- **Frontend:** Next.js application responsible for user interfaces, examination workflows, and performance visualizations.
- **Backend:** FastAPI REST API responsible for authentication, PDF processing, session management, scoring, and AI integration.
- **Database:** MongoDB stores user information, PDF metadata, test sessions, mentor test templates, and recommendations.
- **AI Services:** OpenAI GPT-4o handles answer extraction, topic classification, and contextual learning hints.

## Project Structure

```text
TestMocker/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── middleware/
│   │   └── auth_middleware.py
│   ├── models/
│   │   ├── user.py
│   │   ├── session.py
│   │   └── pdf_file.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── pdf.py
│   │   ├── sessions.py
│   │   ├── answers.py
│   │   ├── hints.py
│   │   ├── analysis.py
│   │   ├── mentors.py
│   │   └── students.py
│   └── services/
│       ├── extraction_service.py
│       ├── scoring_service.py
│       └── crypto_service.py
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
│
├── docker-compose.yml
└── README.md
```

## Requirements

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.10+ (for local backend development)
- MongoDB 7.0 (for local development)
- OpenAI API key (required for AI-powered features)

## Setup and Run Using Docker Compose

**1. Clone the repository**

```bash
git clone <repository-url>
cd TestMocker
```

**2. Configure environment variables**

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
```

An OpenAI API key can also be configured through the application's profile settings.

**3. Start the application**

```bash
docker compose up --build
```

**4. Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Interactive API documentation: http://localhost:8000/docs

MongoDB runs inside Docker Compose and persists its data through a named volume.

## Local Development

**Backend**

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

**Frontend**

```bash
cd frontend

npm install

npm run dev
```

For local development, configure MongoDB and the frontend API URL according to the backend configuration. The default local MongoDB connection uses port 27018.

## Future Improvements

- Background processing for long-running PDF extraction tasks.
- Improved AI response validation and answer verification.
- Cloud-based PDF storage.
- Automated unit and integration testing.
- Enhanced error handling and monitoring.
- More detailed student performance recommendations.

---

**TestMocker** – Making competitive exam preparation more accessible through automated assessment and AI-assisted learning.
