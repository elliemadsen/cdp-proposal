const modules = Array.from(document.querySelectorAll(".module"));
const progressIndicator = document.getElementById("progress-indicator");
const progressTrack = document.getElementById("progress-track");
let current = 0;

document.addEventListener("DOMContentLoaded", () => {
  const modules = document.querySelectorAll(".module");
  let current = 0;

  // Restore from localStorage if available
  const saved = localStorage.getItem("currentModule");
  if (saved !== null && !isNaN(saved) && modules[saved]) {
    current = parseInt(saved, 10);
  }

  function updateModules() {
    modules.forEach((mod, i) => {
      mod.classList.remove("active", "above", "below");
      if (i === current) mod.classList.add("active");
      else if (i < current) mod.classList.add("above");
      else mod.classList.add("below");
    });

    localStorage.setItem("currentModule", current);

    // Move progress indicator
    const trackHeight =
      progressTrack.offsetHeight - progressIndicator.offsetHeight;
    const top = (trackHeight * current) / (modules.length - 1);
    progressIndicator.style.top = `${top}px`;
  }

  // Allow scrolling within a module if content is taller than viewport
  modules.forEach((mod, idx) => {
    mod.addEventListener(
      "wheel",
      (e) => {
        if (!mod.classList.contains("active")) return;
        const atTop = mod.scrollTop === 0;
        const atBottom =
          Math.abs(mod.scrollHeight - mod.scrollTop - mod.clientHeight) < 2;
        if (e.deltaY < 0 && atTop && current > 0) {
          // Scroll up to previous module
          current--;
          updateModules();
        } else if (e.deltaY > 0 && atBottom && current < modules.length - 1) {
          // Scroll down to next module
          current++;
          updateModules();
        }
      },
      { passive: false }
    );
  });

  // Touch swipe navigation (optional, for mobile)
  let touchStartY = null;
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
  });
  document.addEventListener("touchend", (e) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY > 60 && current > 0) {
      current--;
      updateModules();
    } else if (touchStartY - touchEndY > 60 && current < modules.length - 1) {
      current++;
      updateModules();
    }
    touchStartY = null;
  });

  // Initialize
  updateModules();

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "ArrowDown" ||
      e.key === "PageDown" ||
      e.key === " " // space bar
    ) {
      if (current < modules.length - 1) {
        current++;
        updateModules();
        e.preventDefault();
      }
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      if (current > 0) {
        current--;
        updateModules();
        e.preventDefault();
      }
    }
  });

  // Scrollbar click and drag logic
  progressTrack.addEventListener("click", (e) => {
    // Only react if not clicking the indicator itself (to avoid double events)
    if (e.target === progressIndicator) return;
    const rect = progressTrack.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = y / (rect.height - progressIndicator.offsetHeight);
    const idx = Math.round(percent * (modules.length - 1));
    if (idx !== current) {
      current = Math.max(0, Math.min(modules.length - 1, idx));
      updateModules();
    }
  });

  // Drag logic
  let dragging = false;
  let dragOffset = 0;

  progressIndicator.addEventListener("mousedown", (e) => {
    dragging = true;
    document.body.style.userSelect = "none";
    const rect = progressIndicator.getBoundingClientRect();
    dragOffset = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const trackRect = progressTrack.getBoundingClientRect();
    let y =
      e.clientY -
      trackRect.top -
      dragOffset +
      progressIndicator.offsetHeight / 2;
    y = Math.max(
      0,
      Math.min(y, trackRect.height - progressIndicator.offsetHeight)
    );
    const percent = y / (trackRect.height - progressIndicator.offsetHeight);
    const idx = Math.round(percent * (modules.length - 1));
    if (idx !== current) {
      current = idx;
      updateModules();
    }
  });

  document.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      document.body.style.userSelect = "";
    }
  });

  // Touch support for mobile
  progressIndicator.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      dragOffset =
        e.touches[0].clientY - progressIndicator.getBoundingClientRect().top;
    },
    { passive: false }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const trackRect = progressTrack.getBoundingClientRect();
      let y =
        e.touches[0].clientY -
        trackRect.top -
        dragOffset +
        progressIndicator.offsetHeight / 2;
      y = Math.max(
        0,
        Math.min(y, trackRect.height - progressIndicator.offsetHeight)
      );
      const percent = y / (trackRect.height - progressIndicator.offsetHeight);
      const idx = Math.round(percent * (modules.length - 1));
      if (idx !== current) {
        current = idx;
        updateModules();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "touchend",
    () => {
      if (dragging) {
        dragging = false;
      }
    },
    { passive: false }
  );
});

// Load and display the networks table from CSV
fetch("data_processing/index-of-networks.csv")
  .then((r) => r.text())
  .then((csv) => {
    const lines = csv.trim().split("\n");
    const headers = lines[0].replace(/\r/g, "").split(",");
    // Indices of columns to keep (without Wikipedia and Primary Source)
    const keep = [0, 1, 2, 3, 4, 5];
    const tbody = document.querySelector("#networks-table tbody");
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
        .replace(/\r/g, "")
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // handles commas in quotes
      const tr = document.createElement("tr");
      keep.forEach((idx) => {
        const td = document.createElement("td");
        let val = row[idx]
          ? row[idx].replace(/^"|"$/g, "").replace(/""/g, '"')
          : "";
        td.textContent = val;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
  });
