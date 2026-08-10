.PHONY: all install ingest run test app-install app-build app-dev clean

PY ?= python3

all: run app-build   ## rebuild everything from raw data + constants, then build the app

install:  ## install the core package (editable) + test deps
	cd core && $(PY) -m pip install -e ".[test,ingest]"

ingest:  ## attempt Tier-A pulls; write DATA_NEEDED.md requests for the rest
	cd core && $(PY) -m denominator ingest

run:  ## run the Monte-Carlo pipeline and emit app JSON + results/
	cd core && $(PY) -m denominator run

test:  ## run invariant + anchor-reproduction tests
	cd core && $(PY) -m pytest -q

app-install:
	cd app && npm install

app-build: ## build the static webapp (consumes app/public/data/*.json from `run`)
	cd app && npm run build

app-dev:
	cd app && npm run dev

clean:
	rm -rf results/paper_numbers.json results/tables.md app/public/data/*.json app/dist
