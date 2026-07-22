# ================================
# Connect Flow Makefile
# Root commands for backend, frontend, Docker, and Prisma
# ================================

SHELL := /bin/sh

BACKEND_DIR := backend
FRONTEND_DIR := frontend

BACKEND_PORT ?= 4000
FRONTEND_PORT ?= 3000

BACKEND_PORTS := $(BACKEND_PORT) 5001 5002 5003 5004 5005 5432 5433 5434 5435 6379 8500 9092 16686
FRONTEND_PORTS := $(FRONTEND_PORT)
PORT_SERVICES := postgresql postgresql@15-main redis-server redis valkey valkey-server

.PHONY: help backend frontend stop clean logs status migrate studio init-migrations kill-backend-ports kill-frontend-port wait-backend

help:
	@echo "Connect Flow - Microservices"
	@echo ""
	@echo "Commands:"
	@echo "  make backend          - Start all backend services"
	@echo "  make frontend         - Start frontend (waits for backend)"
	@echo "  make stop             - Stop all services"
	@echo "  make clean            - Stop and delete all data"
	@echo "  make logs             - Show logs"
	@echo "  make status           - Show service status"
	@echo "  make init-migrations  - Generate initial migrations"
	@echo "  make migrate          - Run Prisma migrations"
	@echo "  make studio           - Open Prisma Studio for all DBs"
	@echo ""
	@echo "URLs:"
	@echo "  API Gateway:  http://localhost:$(BACKEND_PORT)/graphql"
	@echo "  Frontend:     http://localhost:$(FRONTEND_PORT)"
	@echo "  Consul UI:    http://localhost:8500"
	@echo "  Jaeger UI:    http://localhost:16686"

backend:
	@echo "[backend] Preparing backend on port $(BACKEND_PORT)..."
	@$(MAKE) kill-backend-ports
	@echo "[docker] Restarting backend Docker services..."
	@cd $(BACKEND_DIR) && docker compose down
	@cd $(BACKEND_DIR) && docker compose up -d --build
	@echo "[postgres] Waiting for auth-db..."
	@until [ "$$(docker inspect --format='{{.State.Health.Status}}' auth-db 2>/dev/null)" = "healthy" ]; do \
		echo "  auth-db is not ready yet; checking again in 3s..."; \
		sleep 3; \
	done
	@until [ "$$(docker inspect --format='{{.State.Health.Status}}' post-db 2>/dev/null)" = "healthy" ]; do \
		echo "  post-db is not ready yet; checking again in 3s..."; \
		sleep 3; \
	done
	@until [ "$$(docker inspect --format='{{.State.Health.Status}}' interaction-db 2>/dev/null)" = "healthy" ]; do \
		echo "  interaction-db is not ready yet; checking again in 3s..."; \
		sleep 3; \
	done
	@echo "[redis] Waiting for redis..."
	@until [ "$$(docker inspect --format='{{.State.Health.Status}}' redis 2>/dev/null)" = "healthy" ]; do \
		echo "  Redis is not ready yet; checking again in 2s..."; \
		sleep 2; \
	done
	@echo "[prisma] Applying migrations..."
	@cd $(BACKEND_DIR) && docker compose exec -T auth-service npx prisma migrate deploy 2>/dev/null || echo "  Auth DB migration skipped"
	@cd $(BACKEND_DIR) && docker compose exec -T post-service npx prisma migrate deploy 2>/dev/null || echo "  Post DB migration skipped"
	@cd $(BACKEND_DIR) && docker compose exec -T interaction-service npx prisma migrate deploy 2>/dev/null || echo "  Interaction DB migration skipped"
	@cd $(BACKEND_DIR) && docker compose exec -T ai-chat-service npx prisma migrate deploy 2>/dev/null || echo "  Chat DB migration skipped"
	@echo ""
	@echo "[backend] All services started!"
	@echo ""
	@echo "  API Gateway:  http://localhost:$(BACKEND_PORT)/graphql"
	@echo "  Consul UI:    http://localhost:8500"
	@echo "  Jaeger UI:    http://localhost:16686"
	@echo ""
	@echo "[backend] Following API Gateway logs (Ctrl+C to exit)..."
	@cd $(BACKEND_DIR) && docker compose logs -f api-gateway

frontend:
	@echo "[frontend] Installing dependencies..."
	@cd $(FRONTEND_DIR) && npm install
	@$(MAKE) wait-backend
	@$(MAKE) kill-frontend-port
	@echo "[frontend] Starting Next.js on port $(FRONTEND_PORT)..."
	@cd $(FRONTEND_DIR) && npm run dev -- --port $(FRONTEND_PORT)

stop:
	@echo "[stop] Stopping backend and frontend app ports..."
	@for port in $(BACKEND_PORT) $(FRONTEND_PORT); do \
		pids="$$(lsof -tiTCP:$$port -sTCP:LISTEN 2>/dev/null || true)"; \
		if [ -n "$$pids" ]; then \
			echo "  Killing process(es) on port $$port: $$pids"; \
			kill -9 $$pids 2>/dev/null || true; \
		else \
			echo "  Port $$port is already free."; \
		fi; \
	done
	@echo "[docker] Stopping backend Docker services..."
	@cd $(BACKEND_DIR) && docker compose down
	@echo "[stop] Done."

clean:
	@echo "[clean] Cleaning up..."
	@cd $(BACKEND_DIR) && docker compose down -v
	@echo "[clean] Done."

logs:
	@cd $(BACKEND_DIR) && docker compose logs -f

status:
	@cd $(BACKEND_DIR) && docker compose ps

init-migrations:
	@echo "[prisma] Generating initial migrations..."
	@cd $(BACKEND_DIR)/services/auth-service && npx prisma migrate dev --name init
	@cd $(BACKEND_DIR)/services/post-service && npx prisma migrate dev --name init
	@cd $(BACKEND_DIR)/services/interaction-service && npx prisma migrate dev --name init
	@cd $(BACKEND_DIR)/services/ai-chat-service && npx prisma migrate dev --name init
	@echo "[prisma] All migrations generated!"

migrate:
	@echo "[prisma] Running migrations..."
	@cd $(BACKEND_DIR) && docker compose exec auth-service npx prisma migrate deploy
	@cd $(BACKEND_DIR) && docker compose exec post-service npx prisma migrate deploy
	@cd $(BACKEND_DIR) && docker compose exec interaction-service npx prisma migrate deploy
	@cd $(BACKEND_DIR) && docker compose exec ai-chat-service npx prisma migrate deploy
	@echo "[prisma] Migrations complete."

studio:
	@echo "[prisma] Opening Prisma Studio..."
	@echo "  Auth DB:         http://localhost:5555"
	@echo "  Post DB:         http://localhost:5556"
	@echo "  Interaction DB:  http://localhost:5557"
	@echo "  Chat DB:         http://localhost:5558"
	@echo ""
	@echo "Press Ctrl+C to stop all studios"
	@trap 'kill 0' EXIT; \
	(cd $(BACKEND_DIR)/services/auth-service && npx prisma studio --port 5555) & \
	(cd $(BACKEND_DIR)/services/post-service && npx prisma studio --port 5556) & \
	(cd $(BACKEND_DIR)/services/interaction-service && npx prisma studio --port 5557) & \
	(cd $(BACKEND_DIR)/services/ai-chat-service && npx prisma studio --port 5558) & \
	wait

wait-backend:
	@echo "[backend] Checking http://localhost:$(BACKEND_PORT)/health before starting frontend..."
	@attempts=0; \
	until curl -fs "http://localhost:$(BACKEND_PORT)/health" >/dev/null 2>&1; do \
		attempts=$$((attempts + 1)); \
		if [ "$$attempts" -ge 60 ]; then \
			echo "[backend] Backend is not ready on port $(BACKEND_PORT). Run 'make backend' first."; \
			exit 1; \
		fi; \
		echo "  Backend is not ready yet; checking again in 2s..."; \
		sleep 2; \
	done
	@echo "[backend] Ready."

kill-frontend-port:
	@pids="$$(lsof -tiTCP:$(FRONTEND_PORT) -sTCP:LISTEN 2>/dev/null || true)"; \
	if [ -n "$$pids" ]; then \
		echo "[ports] Freeing frontend port $(FRONTEND_PORT): $$pids"; \
		kill -9 $$pids 2>/dev/null || true; \
	else \
		echo "[ports] Frontend port $(FRONTEND_PORT) is free."; \
	fi

kill-backend-ports:
	@echo "[ports] Freeing backend ports: $(BACKEND_PORTS)"
	@for port in $(BACKEND_PORTS); do \
		containers="$$(docker ps -aq --filter "publish=$$port" 2>/dev/null || true)"; \
		mapped_containers="$$(docker ps -a --format '{{.ID}} {{.Ports}}' 2>/dev/null | awk -v port=":$$port->" 'index($$0, port) { print $$1 }' || true)"; \
		containers="$$(printf '%s\n%s\n' "$$containers" "$$mapped_containers" | awk 'NF && !seen[$$0]++')"; \
		if [ -n "$$containers" ]; then \
			echo "  Removing Docker container(s) on port $$port: $$containers"; \
			docker rm -f $$containers >/dev/null 2>&1 || true; \
		fi; \
	done
	@if command -v systemctl >/dev/null 2>&1; then \
		for service in $(PORT_SERVICES); do \
			if systemctl list-unit-files "$$service.service" --no-legend 2>/dev/null | grep -q .; then \
				if systemctl is-active "$$service.service" >/dev/null 2>&1; then \
					echo "  Stopping local service $$service..."; \
					sudo systemctl stop "$$service.service" >/dev/null 2>&1 || true; \
					sudo systemctl kill "$$service.service" >/dev/null 2>&1 || true; \
				fi; \
			fi; \
		done; \
	fi
	@for port in $(BACKEND_PORTS); do \
		pids="$$(lsof -tiTCP:$$port -sTCP:LISTEN 2>/dev/null || true)"; \
		if [ -n "$$pids" ]; then \
			echo "  Killing process(es) on port $$port: $$pids"; \
			if command -v fuser >/dev/null 2>&1; then \
				fuser -k -n tcp $$port >/dev/null 2>&1 || true; \
			fi; \
			kill -9 $$pids 2>/dev/null || true; \
		fi; \
	done
	@sleep 2
	@blocked=""; \
	for port in $(BACKEND_PORTS); do \
		pids="$$(lsof -tiTCP:$$port -sTCP:LISTEN 2>/dev/null || true)"; \
		if [ -n "$$pids" ]; then \
			blocked="$$blocked $$port"; \
		fi; \
	done; \
	if [ -n "$$blocked" ]; then \
		echo "[ports] Some backend ports still need sudo:$$blocked"; \
		for port in $$blocked; do \
			pids="$$(sudo lsof -tiTCP:$$port -sTCP:LISTEN 2>/dev/null || true)"; \
			if [ -n "$$pids" ]; then \
				echo "  Killing process(es) on port $$port with sudo: $$pids"; \
				if command -v fuser >/dev/null 2>&1; then \
					sudo fuser -k -n tcp $$port >/dev/null 2>&1 || true; \
				fi; \
				sudo kill -9 $$pids 2>/dev/null || true; \
			fi; \
		done; \
	fi
	@echo "[ports] Backend ports are ready."
