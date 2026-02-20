.PHONY: help clean stop start restart status logs

help:
	@echo "Connect Flow - Backend Infrastructure"
	@echo ""
	@echo "Available commands:"
	@echo "  make start    - Start all infrastructure services"
	@echo "  make stop     - Stop all services"
	@echo "  make restart  - Restart all services"
	@echo "  make clean    - Stop services and clean up (delete volumes)"
	@echo "  make status   - Show status of all services"
	@echo "  make logs     - Show logs from all services"

start:
	@echo "🛑 Stopping all Docker containers..."
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	@cd infrastructure && docker-compose down 2>/dev/null || true
	@echo "🔓 Releasing ports..."
	@-lsof -ti:5432 | xargs -r sudo kill -9 2>/dev/null || true
	@-lsof -ti:5433 | xargs -r sudo kill -9 2>/dev/null || true
	@-lsof -ti:5434 | xargs -r sudo kill -9 2>/dev/null || true
	@-lsof -ti:6379 | xargs -r sudo kill -9 2>/dev/null || true
	@-lsof -ti:9092 | xargs -r sudo kill -9 2>/dev/null || true
	@-lsof -ti:8500 | xargs -r sudo kill -9 2>/dev/null || true
	@-lsof -ti:16686 | xargs -r sudo kill -9 2>/dev/null || true
	@-lsof -ti:14268 | xargs -r sudo kill -9 2>/dev/null || true
	@echo "🚀 Starting infrastructure services..."
	@cd infrastructure && docker-compose up -d
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 5
	@echo ""
	@echo "✅ Infrastructure started!"
	@echo ""
	@echo "Services:"
	@echo "  - Auth DB:        localhost:5432"
	@echo "  - Post DB:        localhost:5433"
	@echo "  - Interaction DB: localhost:5434"
	@echo "  - Redis:          localhost:6379"
	@echo "  - Kafka:          localhost:9092"
	@echo "  - Consul UI:      http://localhost:8500"
	@echo "  - Jaeger UI:      http://localhost:16686"

stop:
	@echo "🛑 Stopping infrastructure services..."
	@cd infrastructure && docker-compose down
	@echo "✅ Services stopped"

clean:
	@echo "🧹 Cleaning up containers and volumes..."
	@cd infrastructure && docker-compose down -v
	@echo "✅ Cleanup complete (all data deleted)"

restart: start

status:
	@echo "📊 Service Status:"
	@cd infrastructure && docker-compose ps

logs:
	@cd infrastructure && docker-compose logs -f
