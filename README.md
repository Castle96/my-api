# Multi-Service AI API Project

## Overview
This project is a multi-service API platform designed for experimentation and integration of AI models and web services. It uses Docker Compose to orchestrate several containers, including:

- **Rust API**: A backend API written in Rust (Axum).
- **Python MCP Server**: A FastAPI-based Model Context Protocol server for integrating multiple AI services.
- **Ollama**: An AI model server that can pull and serve models such as Mistral.
- **React UI**: A web frontend built with React and served via a Node.js static server (no nginx).
- **Traefik**: A reverse proxy for routing requests to the appropriate services and providing a dashboard.

All services communicate over a shared Docker network for easy integration and testing. Traefik handles all routing and dashboard access.

## Features
- Containerized development and deployment for all services
- Automatic pulling of the Mistral model for Ollama
- Traefik reverse proxy for service routing
- React UI for user interaction
- Easy extension for additional AI models or APIs

## Directory Structure
```
my-api/
├── docker-compose.yml
├── ollama-pull-model.sh
├── traefik/
│   └── traefik.yml
├── mcp-server/
│   └── main.py
├── ui/
│   └── Dockerfile (no nginx, uses Node.js static server)
│   └── ...
├── Dockerfile (Rust API)
└── ...
```

## Setup Instructions
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-api
   ```

2. **Ensure Docker and Docker Compose are installed**
   - [Docker Installation Guide](https://docs.docker.com/get-docker/)
   - [Docker Compose Installation Guide](https://docs.docker.com/compose/install/)

3. **Build and start all services**
  ```bash
  docker compose up --build
  ```
  This will build all containers and start the services. The Ollama container will automatically pull the Mistral model using the included script.

4. **Access the services**
  - **React UI**: http://localhost (routed via Traefik)
  - **Rust API**: http://localhost:8000
  - **Python MCP Server**: http://localhost:4000
  - **Ollama**: http://localhost:11434
  - **Traefik Dashboard**: http://localhost:8080/dashboard/

## Troubleshooting
### Common Issues
**Docker Compose fails with image not found**
  - Ensure all service images exist or are buildable. The Mistral model is now pulled via Ollama, not as a separate image.
**Port conflicts**
  - Make sure the required ports (4000, 8000, 11434, 80, 8080) are not in use by other applications. Only Traefik should use port 80 and 8080.
**Ollama model not available**
  - The script `ollama-pull-model.sh` runs automatically. If the model is not available, check Ollama logs for errors.
**Service not reachable**
  - Check container logs with `docker compose logs <service-name>`.
  - Ensure the service is running with `docker compose ps`.
**Network issues between containers**
  - All services use the `sharednet` network. If containers cannot communicate, restart Docker and try again.

### Manual Model Pull (if needed)
If the automatic pull fails, you can manually run:
```bash
docker exec -it ollama ollama pull mistral
```

### Rebuilding Containers
If you change code or configuration, rebuild with:
```bash
docker compose up --build
```

### Stopping and Removing Containers
To stop all services:
```bash
docker compose down
```

## Extending the Project
- Add new services by editing `docker-compose.yml`.
- Add new models to Ollama by updating the pull script or running `ollama pull <model>` inside the container.
- Update Traefik rules for new APIs or UIs.

## Support
If you encounter issues not covered here, check the logs, review Docker documentation, or ask for help with specific error messages. Traefik now handles all routing and dashboard access; nginx is no longer part of the project.
