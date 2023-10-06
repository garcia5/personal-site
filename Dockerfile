FROM python:3.11
RUN apt-get update && apt-get install -y \
    curl \
    nodejs \
    npm \
    && apt-get clean

# Copy relevant files
WORKDIR /app

COPY agarcia /app/agarcia
COPY package*.json ./
COPY pyproject.toml ./
COPY requirements.txt ./
COPY tailwind.config.js ./

RUN ls

# Build tailwind
ENV NODE_ENV=production
RUN npm install
RUN npm run build

# Build python
# RUN rye sync --no-lock
RUN python -m ensurepip
RUN python -m pip install -r requirements.txt

# Expose the port that the application will run on
EXPOSE 8080

# Command to run the application
CMD ["gunicorn", "-w", "4", "agarcia:create_app()"]
