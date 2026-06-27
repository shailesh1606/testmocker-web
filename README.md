# TestMocker

TestMocker is a full-stack digital mock test platform designed for competitive exam prep. 

## Requirements
- Docker and Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.10+ (for local backend dev)

## Setup and Run via Docker
1. Clone this repository.
2. In the root directory, create a `.env` file (if you have an OpenAI API key) or just export the variable:
   ```bash
   export OPENAI_API_KEY=your_key
   ```
3. Run the stack:
   ```bash
   docker-compose up -d --build
   ```
4. Access the frontend at [http://localhost:3000](http://localhost:3000) and the backend API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

## Local Development
- Python App: `cd backend` -> `pip install -r requirements.txt` -> `uvicorn main:app --reload`
- Next.js App: `cd frontend` -> `npm install` -> `npm run dev`
