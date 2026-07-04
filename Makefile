# Makefile helpers for common tasks

SHELL := /bin/sh
PNPM ?= pnpm

.PHONY: help install dev build start lint format format-fix check test migrate docker-up docker-down docker-logs ci

help:
	@echo "Available targets:"
	@echo "  install       - pnpm install --frozen-lockfile"
	@echo "  dev           - next dev"
	@echo "  build         - prisma generate + next build"
	@echo "  start         - next start"
	@echo "  lint          - eslint via pnpm lint"
	@echo "  format        - prettier --check"
	@echo "  format-fix    - prettier --write"
	@echo "  test          - jest"
	@echo "  migrate       - prisma migrate deploy"
	@echo "  check         - format-fix + lint + test + build"
	@echo "  docker-up     - docker compose up --build -d"
	@echo "  docker-down   - docker compose down"
	@echo "  docker-logs   - docker compose logs -f"
	@echo "  ci            - same checks as CI (lint, format, test, build)"

install:
	$(PNPM) install --frozen-lockfile

dev:
	$(PNPM) run dev

build:
	$(PNPM) run build

start:
	$(PNPM) run start

lint:
	$(PNPM) run lint

format:
	$(PNPM) run format

format-fix:
	$(PNPM) run format:fix

test:
	$(PNPM) run test

migrate:
	$(PNPM) exec prisma migrate deploy

check: format-fix lint test build

ci: check

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
