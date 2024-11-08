run:
	python .notion-exporter/export.py
	python .notion-exporter/format.py

run-debug:
	DEBUG=1 make run

format:
	python .notion-exporter/format.py

format-debug:
	DEBUG=1 make format
