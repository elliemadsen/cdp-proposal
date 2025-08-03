import csv
import json

# Input and output file paths
input_csv_path = "index-of-networks.csv"
output_json_path = "network_graph.json"

nodes = {}
edges = []


# Helper to add a node
def add_node(id, type, link=None):
    if id and id not in nodes:
        nodes[id] = {"id": id, "type": type}
        if link:
            nodes[id]["link"] = link


# Read and parse CSV
with open(input_csv_path, newline="", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        year = row.get("Year", "").strip()
        author_raw = row.get("Author", "").strip()
        institution = row.get("Institution", "").strip()
        field = row.get("Field", "").strip()
        contribution = row.get("Contribution", "").strip()

        # Parse multiple data separated by & or / or ,
        authors = [a.strip() for a in author_raw.split("&") if a.strip()]
        institutions = [i.strip() for i in institution.split("/") if i.strip()]
        fields = [f.strip() for f in field.split("/") if f.strip()]
        contributions = [c.strip() for c in contribution.split(",") if c.strip()]

        # Add nodes
        for author in authors:
            add_node(author, "person")

        for contribution in contributions:
            add_node(contribution, "contribution")

        for institution in institutions:
            add_node(institution, "institution")

        for field in fields:
            add_node(field, "field")

        # Add edges
        for field in fields:
            for author in authors:
                edges.append({"source": author, "target": field, "type": "works_in"})
            for contribution in contributions:
                edges.append(
                    {
                        "source": contribution,
                        "target": field,
                        "type": "categorized_as",
                    }
                )
        for author in authors:
            for contrib in contributions:
                edges.append({"source": author, "target": contrib, "type": "created"})
            for institution in institutions:
                edges.append(
                    {"source": author, "target": institution, "type": "affiliated_with"}
                )

        for institution in institutions:
            for contribution in contributions:
                edges.append(
                    {
                        "source": institution,
                        "target": contribution,
                        "type": "contributed_to",
                    }
                )

    # Add some manual edges for specific relationships
    edges.append(
        {
            "source": "Philosophy",
            "target": "Media Theory",
            "type": "affiliated_with",
        }
    )
    edges.append(
        {
            "source": "Architecture",
            "target": "Computational Design",
            "type": "affiliated_with",
        },
    )
    edges.append(
        {
            "source": "Mapping",
            "target": "mental maps",
            "type": "affiliated_with",
        },
    )
    edges.append(
        {
            "source": "Urbanism",
            "target": "MIT Media Lab",
            "type": "affiliated_with",
        },
    )
    edges.append(
        {
            "source": "MIT",
            "target": "MIT Media Lab",
            "type": "affiliated_with",
        },
    )
    edges.append(
        {
            "source": "rhizome",
            "target": "Wood Wide Web",
            "type": "affiliated_with",
        },
    )

# Convert to list
graph_data = {"nodes": list(nodes.values()), "edges": edges}

# Save JSON
with open(output_json_path, "w", encoding="utf-8") as f:
    json.dump(graph_data, f, indent=2)

print("Graph JSON written to", output_json_path)
