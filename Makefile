# Root Makefile for Node.js monorepo

MEMBERS ?= config logger

# 0) Install dependencies
.PHONY: install
install:
	@echo "===> Installing dependencies"
	@yarn install --immutable

# 1) Build all packages (topological order)
.PHONY: build
build: install
	@echo "===> Building all packages"
	@yarn build

# 2) Test targets
define TEST_TEMPLATE
.PHONY: test-$(1)
test-$(1): install
	@echo "===> Testing $(1)"
	@yarn workspace @my/$(1) run test
endef

$(foreach m,$(MEMBERS),$(eval $(call TEST_TEMPLATE,$(m))))

.PHONY: test-all
test-all: $(MEMBERS:%=test-%)

.PHONY: test
test: install
	@echo "===> Running all tests"
	@yarn test

# 3) Lint and typecheck
.PHONY: lint
lint: install
	@echo "===> Running linter"
	@yarn lint

.PHONY: typecheck
typecheck: install
	@echo "===> Running type checker"
	@yarn typecheck

# 4) CI entrypoint
.PHONY: ci
ci: install
	@echo "===> Running CI pipeline"
	@yarn ci
	@echo "===> CI done"

# 5) Test only (no lint/typecheck)
.PHONY: test-only
test-only: test-all
	@echo "===> Tests completed successfully"

# 6) Full check with detailed reporting
.PHONY: check
check: install
	@echo "===> Running full check"
	@LINT_RESULT=0; \
	yarn lint || LINT_RESULT=$$?; \
	if [ $$LINT_RESULT -ne 0 ]; then \
		echo ""; \
		echo "LINT FAILED"; \
		exit 1; \
	fi; \
	echo "Lint passed"; \
	TC_RESULT=0; \
	yarn typecheck || TC_RESULT=$$?; \
	if [ $$TC_RESULT -ne 0 ]; then \
		echo ""; \
		echo "TYPECHECK FAILED"; \
		exit 2; \
	fi; \
	echo "Typecheck passed"; \
	TEST_RESULT=0; \
	yarn test || TEST_RESULT=$$?; \
	if [ $$TEST_RESULT -ne 0 ]; then \
		echo ""; \
		echo "TESTS FAILED"; \
		exit 3; \
	fi; \
	echo ""; \
	echo "All checks passed"
