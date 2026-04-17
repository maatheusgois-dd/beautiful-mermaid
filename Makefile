# Beautiful Mermaid — Makefile
#
# Common targets for local development and deployment.
# Run `make help` for a summary.

SHELL := /bin/bash

SITE_DIR := site
FIREBASE := bunx firebase-tools
BUN := bun

.DEFAULT_GOAL := help

.PHONY: help install clean dev editor samples build \
	firebase-login firebase-logout deploy preview \
	deploy-cloudflare

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	$(BUN) install

clean: ## Remove generated artifacts
	rm -rf $(SITE_DIR) editor.html index.html dist

dev: ## Run local dev server
	$(BUN) run dev

editor: ## Build editor.html
	$(BUN) run editor

samples: ## Build index.html (samples showcase)
	$(BUN) run samples

build: clean editor samples ## Build full site/ for deployment (editor as index)
	@mkdir -p $(SITE_DIR)
	@mv index.html $(SITE_DIR)/samples.html
	@mv editor.html $(SITE_DIR)/index.html
	@cp -r public/* $(SITE_DIR)/
	@echo "✓ Site built at $(SITE_DIR)/ (editor served as /, samples at /samples)"
	@ls -lh $(SITE_DIR)/

firebase-login: ## Log in to Firebase CLI
	$(FIREBASE) login

firebase-logout: ## Log out of Firebase CLI
	$(FIREBASE) logout

deploy: build ## Build and deploy to Firebase Hosting (production)
	$(FIREBASE) deploy --only hosting

preview: build ## Deploy to a Firebase preview channel (7-day expiry)
	$(FIREBASE) hosting:channel:deploy preview --expires 7d

deploy-cloudflare: ## Deploy to Cloudflare Pages (existing wrangler workflow)
	$(BUN) run deploy
