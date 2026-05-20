# Polis civic platform - Python Backend API

This directory contains the production-ready Python backend for the Polis platform. It is built using **FastAPI**, **SQLAlchemy** (using PostgreSQL for cloud production and SQLite for local development), and **Pydantic v2** for validation.

## Architecture

The backend conforms to modern clean architecture principles using the **Repository Pattern** and **Dependency Injection** to keep the core code highly testable, decoupled, and modular:

*   **`app/main.py`**: The entry point for the FastAPI application, configuring CORS middleware, database hooks, and routers.
*   **`app/config/`**: Manages environment variables and database connections dynamically using `pydantic-settings`.
*   **`app/api/`**: Contains API dependencies (like database sessions and repository providers).
*   **`app/routers/`**: HTTP route handlers mapping URLs to business logic handlers. Includes `/health` and `/ready` probes for AWS load balancers.
*   **`app/models/`**: SQLAlchemy declarative ORM models representing the database schema.
*   **`app/schemas/`**: Pydantic models for request validation and response serialization.
*   **`app/repositories/`**: Database abstraction layer containing query logics, keeping database code decoupled from controllers.
*   **`app/utils/`**: Utility modules such as Cloud logging configurations and AWS SDK wrappers (`boto3`).

---

## Local Development Setup

### 1. Prerequisite
Ensure you have **Python 3.10+** installed.

### 2. Create Virtual Environment
Run the following commands in your shell inside this `backend` folder:

```bash
# Create the virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Create a local `.env` file by copying the template:
```bash
copy .env.example .env
```
By default, the server will use a local SQLite database (`polis.db`) which automatically creates itself upon starting.

### 5. Run the Application
Start the development server using `uvicorn`:
```bash
uvicorn app.main:app --reload
```

*   **API Root**: `http://127.0.0.1:8000/`
*   **Interactive API Docs (Swagger)**: `http://127.0.0.1:8000/docs`
*   **Alternative API Docs (ReDoc)**: `http://127.0.0.1:8000/redoc`

---

## AWS Deployment Guide

This backend is packaged with a multi-stage `Dockerfile`, ready for deployment to AWS services.

### Option A: AWS App Runner (Recommended, Simplest)
AWS App Runner is a fully managed service that makes it easy for developers to quickly deploy containerized web applications.

1.  **Push Code to GitHub**: Put your backend codebase in a GitHub repository.
2.  **Create AWS App Runner Service**:
    *   Go to the AWS App Runner console.
    *   Select **Source code repository** or **Container registry** (if using ECR).
    *   Connect your GitHub repository and select the branch.
    *   Select **Configuration file** (to use code configurations) or **Configure settings here**:
        *   Runtime: **Python 3** (or choose **Container** if using the `Dockerfile`).
        *   Build command: `pip install -r requirements.txt` (if using Python runtime directly).
        *   Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
        *   Port: `8000`.
    *   Add your production variables in the Env Variables section:
        *   `ENV`: `production`
        *   `DEBUG`: `false`
        *   `DATABASE_URL`: `postgresql://<user>:<password>@<rds-endpoint>:5432/<dbname>`
    *   Click **Create & Deploy**.

---

### Option B: AWS ECS Fargate (Standard Enterprise Setup)
AWS Elastic Container Service (ECS) with Fargate offers fine-grained networking, security, and scaling rules.

#### Step 1: Create an Amazon Elastic Container Registry (ECR) Repository
1. Log in to the AWS Console and search for ECR.
2. Create a private repository named `polis-backend`.
3. Use the **View push commands** helper on ECR console to authenticate your local Docker client and push:
```bash
# Log in to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com

# Build the docker container
docker build -t polis-backend .

# Tag the image
docker tag polis-backend:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/polis-backend:latest

# Push to ECR
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/polis-backend:latest
```

#### Step 2: Set up a Database (Amazon RDS PostgreSQL)
1. Navigate to Amazon RDS in the AWS Console.
2. Launch a PostgreSQL DB Instance (Free Tier or db.t4g.micro is recommended for development).
3. Ensure security groups allow inbound TCP connections on port `5432` from your ECS tasks.

#### Step 3: Create ECS Task Definition and Service
1. Create a task definition specifying **Fargate** as the launch type.
2. Add the container specifying the ECR Image URL: `<aws_account_id>.dkr.ecr.<region>.amazonaws.com/polis-backend:latest`.
3. Map container port `8000`.
4. Define environment variables (`DATABASE_URL`, `ENV=production`, `DEBUG=false`).
5. Create a Fargate cluster and launch an ECS Service using your new Task Definition.

#### Step 4: Setup ALB (Application Load Balancer)
When configuring the Application Load Balancer target group:
*   Set protocol to **HTTP**, port to **8000**.
*   Configure **Health Check path** to `/health` (or `/ready` to check active database connections).
*   Attach the target group to the ECS Service.
