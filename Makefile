.PHONY: all install ingest orphanet-sync run test verify repro docx app-install app-build app-dev clean help

PY ?= python3

all: run app-build   ## rebuild everything from raw data + constants, then build the app

help:  ## list targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n",$$1,$$2}'

install:  ## install the core package (editable) + test + ingest deps
	cd core && $(PY) -m pip install -e ".[test,ingest]"

ingest:  ## attempt Tier-A pulls; write DATA_NEEDED.md requests for the rest
	cd core && $(PY) -m denominator ingest

orphanet-sync:  ## regenerate rare_orphanet.yaml + core promotions from data/raw/orphanet/*.xml
	cd core && $(PY) -m denominator orphanet-sync

run:  ## run the Monte-Carlo pipeline and emit app JSON + results/
	cd core && $(PY) -m denominator run

test:  ## run invariant + anchor-reproduction tests
	cd core && $(PY) -m pytest -q

verify: test  ## run tests then reproduce the pipeline (a clean-room reproducibility check)
	cd core && $(PY) -m denominator run --draws 20000

repro: install run test  ## one-command reproduce: install, run pipeline, run tests

docx:  ## rebuild the manuscript revision + methods supplement (needs python-docx)
	$(PY) results/build_revision_docx.py

app-install:
	cd app && npm install

app-build: ## build the static webapp (consumes app/public/data/*.json from `run`)
	cd app && npm run build

app-dev:
	cd app && npm run dev

clean:
	rm -rf results/paper_numbers.json results/tables.md app/public/data/*.json app/dist
