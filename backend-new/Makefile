.PHONY: help start stop clean logs status migrate studio init-migrations

help:
	@echo "Connect Flow - Microservices Backend"
	@echo ""
	@echo "Commands:"
	@echo "  make start            - Start all services"
	@echo "  make stop             - Stop all services"
	@echo "  make clean            - Stop and delete all data"
	@echo "  make logs             - Show logs"
	@echo "  make status           - Show service status"
	@echo "  make init-migrations  - Generate initial migrations"
	@echo "  make migrate          - Run Prisma migrations"
	@echo "  make studio           - Open Prisma Studio for all DBs"
	@echo ""
	@echo "URLs:"
	@echo "  API Gateway:  http://localhost:4000"
	@echo "  Consul UI:    http://localhost:8500"
	@echo "  Jaeger UI:    http://localhost:16686"

init-migrations:
	@echo "📝 Generating initial migrations..."
	@echo ""
	@echo "Auth Service:"
	@cd services/auth-service && npx prisma migrate dev --name init
	@echo ""
	@echo "Post Service:"
	@cd services/post-service && npx prisma migrate dev --name init
	@echo ""
	@echo "Interaction Service:"
	@cd services/interaction-service && npx prisma migrate dev --name init
	@echo ""
	@echo "✅ All migrations generated!"

start:
	@echo "🛑 Stopping old containers..."
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	@docker-compose down 2>/dev/null || true
	@echo "🔓 Releasing ports..."
	@-lsof -ti:4000 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:5001 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:5002 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:5003 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:5004 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:5432 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:5433 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:5434 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:6379 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:8500 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:9092 | xargs -r kill -9 2>/dev/null || true
	@-lsof -ti:16686 | xargs -r kill -9 2>/dev/null || true
	@echo "🚀 Starting all services..."
	@docker-compose up -d --build
	@echo "⏳ Waiting for databases to be ready..."
	@sleep 5
	@echo "🔄 Running Prisma migrations..."
	@docker-compose exec -T auth-service npx prisma migrate deploy 2>/dev/null || echo "⚠️  Auth DB migration skipped"
	@docker-compose exec -T post-service npx prisma migrate deploy 2>/dev/null || echo "⚠️  Post DB migration skipped"
	@docker-compose exec -T interaction-service npx prisma migrate deploy 2>/dev/null || echo "⚠️  Interaction DB migration skipped"
	@echo "📦 Generating Prisma clients..."
	@docker-compose exec -T auth-service npx prisma generate 2>/dev/null || echo "⚠️  Auth client generation skipped"
	@docker-compose exec -T post-service npx prisma generate 2>/dev/null || echo "⚠️  Post client generation skipped"
	@docker-compose exec -T interaction-service npx prisma generate 2>/dev/null || echo "⚠️  Interaction client generation skipped"
	@echo ""
	@echo "✅ All services started!"
	@echo ""
	@echo "URLs:"
	@echo "  API Gateway:  http://localhost:4000"
	@echo "  Consul UI:    http://localhost:8500"
	@echo "  Jaeger UI:    http://localhost:16686"
	@echo ""
	@echo "📡 Following API Gateway logs (Ctrl+C to exit)..."
	@echo ""
	@docker-compose logs -f api-gateway

stop:
	@echo "🛑 Stopping all services..."
	@docker-compose down

clean:
	@echo "🧹 Cleaning up..."
	@docker-compose down -v
	@echo "✅ Cleanup complete"

logs:
	@docker-compose logs -f

status:
	@docker-compose ps

migrate:
	@echo "🔄 Running Prisma migrations..."
	@docker-compose exec auth-service npx prisma migrate deploy
	@docker-compose exec post-service npx prisma migrate deploy
	@docker-compose exec interaction-service npx prisma migrate deploy
	@echo "✅ Migrations complete"

studio:
	@echo "🎨 Opening Prisma Studio for all databases..."
	@echo ""
	@echo "Auth DB:         http://localhost:5555"
	@echo "Post DB:         http://localhost:5556"
	@echo "Interaction DB:  http://localhost:5557"
	@echo ""
	@echo "Press Ctrl+C to stop all studios"
	@echo ""
	@trap 'kill 0' EXIT; \
	(cd services/auth-service && npx prisma studio --port 5555) & \
	(cd services/post-service && npx prisma studio --port 5556) & \
	(cd services/interaction-service && npx prisma studio --port 5557) & \
	wait
