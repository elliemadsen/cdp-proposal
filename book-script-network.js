// Parse a CSV line, handling quoted fields
function parseLocalCSVLine(line) {
  const regex = /("(?:[^"]|"")*")|([^,"]+)/g;
  const values = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    values.push(match[0].replace(/(^"|"$)/g, "").replace(/""/g, '"'));
  }
  return values;
}

// Fetch and parse local CSV
function fetchLocalCSVData() {
  return fetch("data_processing/network-library.csv")
    .then((response) => response.text())
    .then((text) => {
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",");
      return lines.slice(1).map((line) => {
        const values = parseLocalCSVLine(line);
        const obj = {};
        headers.forEach((header, index) => {
          if (header.trim() === "embedding_2d") {
            try {
              const embedding = JSON.parse(values[index] || "[0,0]");
              if (embedding.length >= 2) {
                obj["x"] = embedding[0];
                obj["y"] = embedding[1];
              }
            } catch {
              obj["x"] = 0;
              obj["y"] = 0;
            }
          } else {
            obj[header.trim()] = values[index] || "";
          }
        });
        return obj;
      });
    });
}

// Generate HTML for book objects (bookshelf)
function generateBooksHTML(books) {
  return books
    .map(
      (book) => `
    <div class="book">
        <img src="https://covers.openlibrary.org/b/isbn/${
          book.isbn
        }-L.jpg" alt="${book.title}" class="book-image">
        <div class="flex-column book-text">
            <p>${book.title}</p>
            <p>${book.author}</p>
            <p class="rating">${"★".repeat(book.rating)}</p>
        </div>
    </div>
    `
    )
    .join("");
}

let networkTransformState = d3.zoomIdentity;
let isNetworkInitialLoad = true;
const nWidth = 1500;
const nHeight = 1000;

function createNetworkScatterPlot(books) {
  const container = document.getElementById("networkEmbeddingChart");
  container.innerHTML = "";

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", nWidth)
    .attr("height", nHeight);

  const imageGroup = svg.append("g");

  // Add zoom event
  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", (event) => {
      networkTransformState = event.transform;
      imageGroup.attr("transform", networkTransformState);
    });

  // On the first load, center the plot within the container
  if (isNetworkInitialLoad) {
    const initialScale = 0.6;
    networkTransformState = d3.zoomIdentity
      .scale(initialScale)
      .translate(200, 0);
    isNetworkInitialLoad = false;
  }

  // Apply the zoom behavior to the SVG
  svg.call(zoom);

  // Restore previous zoom state if available
  svg.call(zoom.transform, networkTransformState);

  // Find min and max values for scaling the positions
  const minX = Math.min(...books.map((book) => book.x));
  const maxX = Math.max(...books.map((book) => book.x));
  const minY = Math.min(...books.map((book) => book.y));
  const maxY = Math.max(...books.map((book) => book.y));

  const padding = 200; // pixels to pad from each edge

  // Function to normalize the x and y positions
  function normalize(value, min, max, size) {
    return ((value - min) / (max - min)) * (size - 2 * padding) + padding;
  }

  books.forEach((book) => {
    book.x = normalize(book.x, minX, maxX, nWidth);
    book.y = normalize(book.y, minY, maxY, nHeight);
  });

  book_width = 40;
  book_height = book_width * 1.5;

  // Add book covers
  books.forEach((book, i) => {
    if (book.x !== 0 && book.y !== 0) {
      // draw lines to nearest neighbors
      const neighbors = books
        .map((other, j) => ({
          index: j,
          dist: Math.hypot(book.x - other.x, book.y - other.y),
        }))
        .filter((n) => n.index !== i)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3); // n nearest neighbors
      neighbors.forEach((n) => {
        imageGroup
          .append("line")
          .attr("x1", book.x)
          .attr("y1", book.y)
          .attr("x2", books[n.index].x)
          .attr("y2", books[n.index].y)
          .attr("stroke", "grey")
          .attr("stroke-width", 1)
          .attr("opacity", 0.5)
          .attr("z-index", -1000);
      });

      // get covers from open library
      imageGroup
        .append("image")
        .attr(
          "xlink:href",
          `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
        )
        .attr("x", book.x - book_width / 2)
        .attr("y", book.y - book_height / 2)
        .attr("width", book_width)
        .attr("height", book_height)
        .attr("alt", book.title)
        .on("mouseover", function () {
          d3.select(this).style("opacity", 0.7); // Hover effect
          showBookDetails(book.description);
        })
        .on("mouseout", function () {
          d3.select(this).style("opacity", 1);
          hideBookDetails(book.title);
        });

      // add description text below the cover
      imageGroup
        .append("text")
        .attr("x", book.x)
        .attr("y", book.y + book_height / 2 + 16)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(book.title);

      imageGroup
        .append("text")
        .attr("x", book.x)
        .attr("y", book.y + book_height / 2 + 32)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .text(book.author);

      imageGroup
        .append("text")
        .attr("x", book.x)
        .attr("y", book.y + book_height / 2 + 48)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .text(book.year);
    }
  });

  // Popup to show book titles on hover
  function showBookDetails(description) {
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(35, 35, 35, 1)")
      .style("z-index", 1000)
      .style("color", "#fff")
      .style("padding", "5px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("max-width", "200px")
      .html(description)
      .style("opacity", 1);

    d3.select("body").on("mousemove", function (event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    });
  }

  // Hide the popup
  function hideBookDetails() {
    d3.select(".tooltip").remove();
  }
}

// Initial load
window.addEventListener("load", () => {
  fetchLocalCSVData()
    .then((csvData) => {
      books = csvData;
      createNetworkScatterPlot(books);
    })
    .catch((error) => {
      console.error("Error fetching or processing CSV:", error);
    });
});
