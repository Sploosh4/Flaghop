# Local web backend. Build the current checkout; desktop rendering runs on the host.
FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    LEGION_HOME=/var/lib/legion/config \
    LEGION_TMPDIR=/var/lib/legion/tmp \
    XDG_CACHE_HOME=/var/lib/legion/cache
RUN apt-get update && apt-get install -y --no-install-recommends nmap curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/legion
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . ./
EXPOSE 5000
CMD ["python", "legion.py", "--web", "--web-bind-all", "--web-port", "5000"]
