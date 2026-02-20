#!/bin/bash

# Microservices Health Check Script
# Verifies all services are running and consumers are active

echo "🔍 MICROSERVICES HEALTH CHECK"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service URLs
AUTH_URL="http://localhost:5001"
POST_URL="http://localhost:5002"
INTERACTION_URL="http://localhost:5003"
FEED_URL="http://localhost:5004"
GATEWAY_URL="http://localhost:4000"

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name${NC} - Running on $url"
        return 0
    else
        echo -e "${RED}❌ $name${NC} - Not responding (HTTP $response)"
        return 1
    fi
}

# Check all services
echo "📡 Checking Service Health..."
echo ""

check_service "Auth Service      " "$AUTH_URL"
check_service "Post Service      " "$POST_URL"
check_service "Interaction Service" "$INTERACTION_URL"
check_service "Feed Service      " "$FEED_URL"
check_service "API Gateway       " "$GATEWAY_URL"

echo ""
echo "=============================="
echo ""

# Check Kafka topics
echo "📨 Checking Kafka Topics..."
echo ""

if command -v docker &> /dev/null; then
    topics=$(docker exec -it $(docker ps -qf "name=kafka") kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null | tr -d '\r')
    
    if [ -n "$topics" ]; then
        echo -e "${GREEN}✅ Kafka is running${NC}"
        echo ""
        echo "Available topics:"
        echo "$topics" | while read -r topic; do
            if [ -n "$topic" ]; then
                echo "  - $topic"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  Kafka topics not found (may not be created yet)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found, skipping Kafka check${NC}"
fi

echo ""
echo "=============================="
echo ""

# Check Redis
echo "💾 Checking Redis..."
echo ""

if command -v docker &> /dev/null; then
    redis_check=$(docker exec -it $(docker ps -qf "name=redis") redis-cli ping 2>/dev/null | tr -d '\r')
    
    if [ "$redis_check" = "PONG" ]; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${RED}❌ Redis is not responding${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found, skipping Redis check${NC}"
fi

echo ""
echo "=============================="
echo ""

# Check PostgreSQL
echo "🗄️  Checking PostgreSQL..."
echo ""

if command -v docker &> /dev/null; then
    pg_check=$(docker exec -it $(docker ps -qf "name=postgres") pg_isready 2>/dev/null)
    
    if echo "$pg_check" | grep -q "accepting connections"; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not responding${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found, skipping PostgreSQL check${NC}"
fi

echo ""
echo "=============================="
echo ""

# Summary
echo "📊 SUMMARY"
echo ""
echo "If all services show ✅, your microservices are ready!"
echo ""
echo "Next steps:"
echo "1. Test user registration: POST $GATEWAY_URL/graphql"
echo "2. Test post creation: POST $GATEWAY_URL/graphql"
echo "3. Test interactions: POST $GATEWAY_URL/graphql"
echo "4. Check feed: POST $GATEWAY_URL/graphql"
echo ""
echo "For detailed logs, check each service's console output."
echo ""
