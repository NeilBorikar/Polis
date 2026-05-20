# Use the official lightweight Python image.
FROM python:3.11-slim AS builder

WORKDIR /app

# Set build-time env variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies needed for compiling some python packages if needed (e.g. pg_config for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies into a virtual environment or local site packages
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Final production stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed dependencies from the builder stage
COPY --from=builder /install /usr/local

# Install runtime dependencies (like libpq for postgresql)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the app source code
COPY ./app /app/app

# Expose port for FastAPI application
EXPOSE 8000

# Set environment variables for production
ENV ENV=production \
    PYTHONPATH=/app

# Command to run the application using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
