run:
	python .notion-exporter/export.py
	python .notion-exporter/format.py

run-debug:
	DEBUG=1 make run

format:
	python .notion-exporter/format.py

format-debug:
	DEBUG=1 make format

reference:
	mkdir -p api-reference
	mkdir -p cli-reference

	git clone https://github.com/blaxel-ai/controlplane.git
	cp controlplane/api/api/definitions/controlplane.yml ./api-reference/controlplane.yml
	rm -rf controlplane

	git clone https://github.com/blaxel-ai/toolkit.git
	cp -r toolkit/docs/* ./cli-reference/
	rm -rf toolkit