SUBDIRS := frontend
TARGETS := setup check test coverage

.PHONY: $(TARGETS) $(SUBDIRS)
$(TARGETS): $(SUBDIRS)
$(SUBDIRS):
	@$(MAKE) -C $@ $(MAKECMDGOALS)

NODE_MODULES := node_modules
TOUCH := node -e "import fs from 'fs'; const f=process.argv[1]; try{fs.utimesSync(f,new Date(),new Date())}catch{fs.closeSync(fs.openSync(f,'w'))}"

package-lock.json: package.json
	@echo "==> Updating lock file..."
	@npm install --package-lock-only

# Build node_modules with deps.
$(NODE_MODULES): package-lock.json
	@echo "==> Installing Node environment..."
	@npm install
	@$(TOUCH) $@

# Convenience target to build node_modules
.PHONY: setup
setup: $(NODE_MODULES)

NGINX_IMAGE := nginx:1.29.4-alpine

# nginx -t verifies that ssl_certificate files exist, so it needs a throwaway
# certificate at the path nginx.conf expects.
.PHONY: check-nginx
check-nginx:
	@echo "==> Validating nginx configuration..."
	@tmp=$$(mktemp -d); \
	mkdir -p $$tmp/live; \
	openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=localhost \
	  -keyout $$tmp/live/privkey.pem -out $$tmp/live/fullchain.pem 2>/dev/null; \
	docker run --rm \
	  -v $$tmp:/etc/letsencrypt:ro \
	  -v $(CURDIR)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
	  -v $(CURDIR)/nginx/includes/:/etc/nginx/includes/:ro \
	  -v $(CURDIR)/nginx/conf.d/:/etc/nginx/conf.d/:ro \
	  $(NGINX_IMAGE) nginx -t; \
	status=$$?; rm -rf $$tmp; exit $$status

.PHONY: check
check: $(NODE_MODULES) check-nginx
	@echo "==> Linting docker compose files..."
	@npm run lint

COMPOSE_DEV = docker compose -f compose.yml -f compose.dev.yml

.PHONY: dev
dev:
	@$(COMPOSE_DEV) up -d
	@echo ""
	@echo "Application started! (development)"
	@echo "Calendrier: https://localhost"

.PHONY: deploy
deploy:
	@echo "==> Pulling external images..."
	@docker compose pull --quiet
	@echo "==> Building images..."
	@docker compose build --pull
	@echo "==> Stopping and recreating services..."
	@docker compose up --detach --remove-orphans --wait
	@echo "==> Removing dangling images..."
	@docker image prune --force
	@echo "==> Deployment complete!"
	@docker compose ps

.PHONY: undeploy
undeploy:
	@echo "==> Stopping services..."
	@docker compose down
	@echo "==> Services stopped"

.PHONY: clean
clean:
	@echo "==> Cleaning ignored files..."
	@git clean -Xfd

.DEFAULT_GOAL := test
