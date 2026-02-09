FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if any needed for pdf processing or ml libraries)
# RUN apt-get update && apt-get install -y ...

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
