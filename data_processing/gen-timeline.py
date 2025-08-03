import pandas as pd
import svgwrite
import textwrap

# Load CSV
df = pd.read_csv("index-of-networks.csv")

# Field color mapping
field_colors = {
    "Math": "#EDADAE",
    "Graph Theory": "#D184A8",
    "Machine Learning": "#9BC3E5",
    "Hypertext": "#A3BFE2",
    "AI": "#97B1DB",
    "WWW": "#6B9DBC",
    "Vector Databases": "#85D9E2",
    "Semantics": "#AC8BDB",
    "Computational Design": "#EEC5A8",
    "Media Theory": "#EABF8B",
    "Sociology": "#CA9679",
    "Speculative Fiction": "#C0A3B8",
    "Feminist Theory": "#F098B8",
    "Philosophy": "#D9A6F0",
    "Ecology": "#C1EB97",
    "Urbanism": "#ADC796",
    "Architecture": "#DFED7B",
    "Mapping": "#A4C8B2",
}

# SVG settings
width, row_height = 800, 100
wrap_width = 40  # n chars per line
line_spacing = 22
font_family = "DM Sans, sans-serif"
row_spacing = 40

# Column positions
x_year = 50
x_descr = 200
x_tags = 600

# Prepare SVG height based on wrapped lines
total_height = 50
line_counts = []

for _, row in df.iterrows():
    lines = textwrap.wrap(row["Description"], width=wrap_width)
    line_counts.append(len(lines))
    total_height += len(lines) * line_spacing + row_spacing

dwg = svgwrite.Drawing("timeline.svg", size=(f"{width}px", f"{total_height}px"))
dwg.add(dwg.rect(insert=(0, 0), size=("100%", "100%"), fill="black"))


# Draw content
y_cursor = 50
for i, row in df.iterrows():
    # Year
    dwg.add(
        dwg.text(
            row["Year"],
            insert=(x_year, y_cursor + 15),
            fill="gray",
            font_size="30px",
            font_family=font_family,
            font_weight="lighter",
        )
    )

    # Description (wrapped)
    wrapped_lines = textwrap.wrap(row["Description"], width=wrap_width)
    for j, line in enumerate(wrapped_lines):
        dwg.add(
            dwg.text(
                line,
                insert=(x_descr, y_cursor + j * line_spacing),
                fill="white",
                font_size="18px",
                font_family=font_family,
                font_weight="lighter",
            )
        )

    # Tags
    tag_y = y_cursor
    tag_x = x_tags
    tags = [tag.strip() for tag in row["Field"].split(" / ")]
    for tag in tags:
        color = field_colors.get(tag, "white")
        font_size = 14
        padding_x = 18
        padding_y = 6

        # Estimate text width (roughly, 0.6 * font_size * num_chars)
        text_width = int(len(tag) * font_size * 0.5)
        box_width = text_width + 2 * padding_x
        box_height = font_size + 2 * padding_y
        box_rx = box_height // 2  # rounded corners

        # Draw rounded rectangle (box)
        dwg.add(
            dwg.rect(
                insert=(tag_x, tag_y - 10),
                size=(box_width, box_height),
                rx=box_rx,
                fill=color,
                stroke="none",
            )
        )
        # Draw black text centered in box
        dwg.add(
            dwg.text(
                tag,
                insert=(
                    tag_x + box_width / 2,
                    tag_y + box_height / 2 + font_size / 3 - 10,
                ),
                fill="black",
                font_size=f"{font_size}px",
                font_family=font_family,
                text_anchor="middle",
                alignment_baseline="middle",
                font_weight="lighter",
            )
        )
        tag_y += box_height + 8  # vertical spacing between tags

    y_cursor += len(wrapped_lines) * line_spacing + row_spacing

# Save
dwg.save()
