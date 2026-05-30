# Future — Makefile
# Run `make help` to see all targets.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Paths
ROOT_DIR   := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))/../
API_DIR    := $(ROOT_DIR)apps/api
WEB_DIR    := $(ROOT_DIR)apps/web
INFRA_DIR  := $(ROOT_DIR)infrastructure

COMPOSE         := docker compose -f $(INFRA_DIR)/docker-compose.yml
COMPOSE_DEV     := docker compose -f $(INFRA_DIR)/docker-compose.yml \
                                  -f $(INFRA_DIR)/docker-compose.dev.yml

# ─── Help ─────────────────────────────────────────────────────────────────────
.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Setup ────────────────────────────────────────────────────────────────────
.PHONY: setup
setup: ## Install all dependencies (api + web)
	@echo "→ Installing API dependencies..."
	cd $(API_DIR) && pip install -r requirements.txt
	@echo "→ Installing Web dependencies..."
	cd $(WEB_DIR) && npm install
	@echo "✓ Setup complete"

# ─── Development ──────────────────────────────────────────────────────────────
.PHONY: dev
dev: ## Start dev environment (hot reload, SQLite)
	$(COMPOSE_DEV) up --build

.PHONY: dev-api
dev-api: ## Start only the API in dev mode
	cd $(API_DIR) && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

.PHONY: dev-web
dev-web: ## Start only the web app in dev mode
	cd $(WEB_DIR) && npm run dev

# ─── Build ────────────────────────────────────────────────────────────────────
.PHONY: build
build: build-api build-web ## Build everything

.PHONY: build-api
build-api: ## Build the API Docker image
	$(COMPOSE) build api

.PHONY: build-web
build-web: ## Build the web app (static dist)
	cd $(WEB_DIR) && npm run build

# ─── Test ─────────────────────────────────────────────────────────────────────
.PHONY: test
test: test-api test-web ## Run all tests

.PHONY: test-api
test-api: ## Run API tests (pytest)
	cd $(API_DIR) && python -m pytest tests/ -v

.PHONY: test-web
test-web: ## Run web tests (vitest)
	cd $(WEB_DIR) && npm test

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	cd $(WEB_DIR) && npm run typecheck

.PHONY: lint
lint: ## Lint all code
	cd $(WEB_DIR) && npm run lint
	cd $(API_DIR) && python -m ruff check .

# ─── Docker ───────────────────────────────────────────────────────────────────
.PHONY: docker-up
docker-up: ## Start full docker compose stack (production mode)
	$(COMPOSE) up -d

.PHONY: docker-down
docker-down: ## Stop docker compose stack
	$(COMPOSE) down

.PHONY: docker-logs
docker-logs: ## Tail docker compose logs
	$(COMPOSE) logs -f

.PHONY: docker-ps
docker-ps: ## Show running containers
	$(COMPOSE) ps

.PHONY: docker-rebuild
docker-rebuild: ## Rebuild + restart all containers
	$(COMPOSE) down
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

# ─── Database ─────────────────────────────────────────────────────────────────
.PHONY: migrate
migrate: ## Run Alembic database migrations
	cd $(API_DIR) && alembic upgrade head

.PHONY: migrate-down
migrate-down: ## Roll back last Alembic migration
	cd $(API_DIR) && alembic downgrade -1

.PHONY: migrate-create
migrate-create: ## Create a new migration (usage: make migrate-create MSG="description")
	cd $(API_DIR) && alembic revision --autogenerate -m "$(MSG)"

.PHONY: seed
seed: ## Seed demo data into the database
	cd $(API_DIR) && python -m scripts.seed

.PHONY: db-shell
db-shell: ## Open a psql shell to the postgres container
	$(COMPOSE) exec postgres psql -U future -d future_db

# ─── Clean ────────────────────────────────────────────────────────────────────
.PHONY: clean
clean: ## Remove build artifacts and caches
	rm -rf $(WEB_DIR)/dist $(WEB_DIR)/node_modules/.cache
	find $(API_DIR) -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find $(API_DIR) -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ Clean complete"

.PHONY: clean-docker
clean-docker: ## Remove docker volumes and images for this project
	$(COMPOSE) down -v --rmi local

# ─── CI helpers ───────────────────────────────────────────────────────────────
.PHONY: ci
ci: lint typecheck test ## Full CI pipeline (lint → typecheck → test)
