# cdp-proposal

this site operates as a thesis proposal presentation for computational design practices.

## data processing

`gen-lib-embeddings.py` uses a sentence transformer model to convert metadata in `network-library.csv` to 2d embeddings. this is used to generate the spatialized network library in `book-script-network.js`.

`gen-timeline.py` generates an SVG drawing of sequential events from `index-of-networks.csv`.

`index-csv-to-graph-json.py` reads `index-of-networks.csv` and writes nodes and links to `network_graph.json`. this is used to generate the d3 network graph in `network-graph-script.js`.

## illustrations

![Network](illustrations/network.png)
