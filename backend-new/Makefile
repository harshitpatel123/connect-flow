.PHONY: help start stop clean logs status

help:
	@echo "Connect Flow - Microservices Backend"
	@echo ""
	@echo "Commands:"
	@echo "  make start   - Start all services"
	@echo "  make stop    - Stop all services"
	@echo "  make clean   - Stop and delete all data"
	@echo "  make logs    - Show logs"
	@echo "  make status  - Show service status"
	@echo ""
	@echo "URLs:"
	@echo "  API Gateway:  http://localhost:4000"
	@echo "  Consul UI:    http://localhost:8500"
	@echo "  Jaeger UI:    http://localhost:16686"

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
