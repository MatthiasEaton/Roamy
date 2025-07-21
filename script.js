let map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 5,
}).addTo(map);

let countryGeoJSON = null;
let highlightedLayers = [];
let entries = JSON.parse(localStorage.getItem('entries')) || [];
let badges = JSON.parse(localStorage.getItem('badges')) || [];


fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
  .then((res) => res.json())
  .then((data) => {
    countryGeoJSON = data;

    const sample = countryGeoJSON.features.slice(0, 10).map(f => f.properties.ADMIN || f.properties.name);

    const entries = loadEntries();

    // Highlight countries on map for all entries
    entries.forEach(entry => {
      const feature = findCountryFeature(entry.country);
      if (feature) highlightCountry(feature, entry.type);
    });

    // Update the entries list UI
    generateBadges(entries);
    updateEntryList(entries);    
  });

function normalizeCountryName(name) {
  const normalized = name.trim().toLowerCase();
  return normalized;
}

function findCountryFeature(countryName) {
  if (!countryGeoJSON || !countryGeoJSON.features) return null;

  const normalized = normalizeCountryName(countryName);

  // Manual alias mapping
  const aliases = {
    "england": "united kingdom",
    "scotland": "united kingdom",
    "wales": "united kingdom",
    "northern ireland": "united kingdom",
    "usa": "united states of america",
    "u.s.a.": "united states of america",
    "united states": "united states of america"
  };

  const aliasMatch = aliases[normalized];
  const targetName = aliasMatch || normalized;

  // Exact match
  let match = countryGeoJSON.features.find(f =>
    (f.properties.ADMIN || f.properties.name || "").toLowerCase() === targetName
  );
  if (match) return match;

  // Partial match fallback
  return countryGeoJSON.features.find(f =>
    (f.properties.ADMIN || f.properties.name || "").toLowerCase().includes(targetName)
  );
}

function highlightCountry(feature, type) {
  if (!feature) {
    console.log("[highlightCountry] No feature found");
    return;
  }

  const color = type === "been" ? "#4CAF50" : "#EB7627";

  const layer = L.geoJSON(feature, {
    style: {
      color,
      weight: 1.5,
      fillColor: color,
      fillOpacity: 0.5,
    },
  }).addTo(map);

  highlightedLayers.push(layer);
}

// Limit zooming out too far
map.setMinZoom(2);

// Restrict panning beyond the world map edges
const bounds = L.latLngBounds(
  L.latLng(-85, -180),  // Southwest
  L.latLng(85, 180)     // Northeast
);
map.setMaxBounds(bounds);
map.on('drag', function() {
  map.panInsideBounds(bounds, { animate: false });
});

// changes local languages on map to english
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap contributors'
  }).addTo(map);
  


function saveEntries(entries) {
  localStorage.setItem("travelEntries", JSON.stringify(entries));
}

function loadEntries() {
    const stored = JSON.parse(localStorage.getItem("travelEntries") || "[]");
  
    const normalized = stored.map(entry => ({
      ...entry,
      date: entry.date || "",
      story: entry.story || "",
      images: entry.images || []
    }));
  
    return normalized;
  }  

  function createEntryElement(entry, index, entries, updateCallback, entryType) {
    if (!entry.id) {
  entry.id = crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random();
}
    const li = document.createElement("li");
  
    // Style based on entry type
    li.style.backgroundColor = entry.type === "been" ? "#d4edda" : "#dbeffe";
    li.style.borderLeft = entry.type === "been" ? "6px solid #4CAF50" : "6px solid #EB7627";
    li.style.padding = "10px";
    li.style.borderRadius = "8px";
    li.style.marginBottom = "8px";
  
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
  
    const name = document.createElement("strong");
    name.textContent = entry.country;
    header.appendChild(name);
  
    const buttonGroup = document.createElement("div");
  
    const expandBtn = document.createElement("button");
    expandBtn.textContent = "Details";
    expandBtn.style.marginRight = "8px";
    expandBtn.style.cursor = "pointer";
  
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.style.display = "none";
    saveBtn.style.marginRight = "8px";
  
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.style.display = "none";
    editBtn.style.marginRight = "8px";
  
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.style.background = "none";
    delBtn.style.border = "none";
    delBtn.style.cursor = "pointer";
    delBtn.style.fontSize = "16px";
  
    // Button actions
    delBtn.onclick = () => {
  if (confirm("Are you sure you want to delete this entry?")) {
    const updatedEntries = entries.filter(e => e.id !== entry.id);

    saveEntries(updatedEntries);
    clearMapHighlights();

    updatedEntries.forEach(e => {
      const f = findCountryFeature(e.country);
      if (f) highlightCountry(f, e.type);
    });

    updateCallback(updatedEntries);
  }
};
  
    // Inputs container
    //

    const detailsDiv = document.createElement("div");
    detailsDiv.style.display = "none";
    detailsDiv.style.marginTop = "10px";

    detailsDiv.classList.add("details-area");

    const dateLabel = document.createElement("label");
    dateLabel.textContent = "When did you visit?";
    dateLabel.setAttribute("for", "dateInput");
  
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = entry.date || "";
    dateInput.style.display = "block";
    dateInput.style.marginBottom = "6px";

    const imageLabel = document.createElement("label");
    imageLabel.textContent = "Any photos to share?";
    dateLabel.setAttribute("for", "imageInput");
  
    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";
    imageInput.multiple = true;
    imageInput.style.display = "block";
    imageInput.style.marginBottom = "6px";
  
    const imagePreviewDiv = document.createElement("div");
    imagePreviewDiv.style.display = "flex";
    imagePreviewDiv.style.flexWrap = "wrap";
    imagePreviewDiv.style.gap = "8px";

    const storyLabel = document.createElement("label");
    storyLabel.textContent =
    entryType === "been" ? "Any good stories?" : "Any plans or exciting reasons to visit?";
    storyLabel.setAttribute("for", "storyBox");
  
    const storyBox = document.createElement("textarea");
    storyBox.rows = 3;
    storyBox.style.width = "100%";
    storyBox.style.marginTop = "6px";

    const citiesLabel = document.createElement("label");
    citiesLabel.textContent = "Any favorite cities?";
    citiesLabel.setAttribute("for", "favoriteCities");

    const favoriteCitiesInput = document.createElement("input");
    favoriteCitiesInput.type = "text";
    favoriteCitiesInput.style.marginTop = "6px";
    favoriteCitiesInput.style.width = "100%";
    favoriteCitiesInput.value = entry.favoriteCities || "";
  
    imageInput.onchange = () => {
      const files = Array.from(imageInput.files);
  
      files.forEach(file => {
        if (!file.type.startsWith("image/")) {
          alert("Only image files are allowed.");
          return;
        }
  
        if (file.size > 2 * 1024 * 1024) {
          alert("Image size should be less than 2MB.");
          return;
        }
  
        const reader = new FileReader();
        reader.onload = (e) => {
          entry.images.push(e.target.result);
          renderImagePreviews();
        };
        reader.readAsDataURL(file);
      });
      imageInput.value = "";
    };
  
    function renderImagePreviews() {
      imagePreviewDiv.innerHTML = ""; // clear existing
  
      entry.images.forEach((src, i) => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = "100px";
  
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "100px";
        img.style.height = "auto";
        img.style.borderRadius = "4px";
  
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✖";
        removeBtn.style.position = "absolute";
        removeBtn.style.top = "0";
        removeBtn.style.right = "0";
        removeBtn.style.background = "rgba(0,0,0,0.5)";
        removeBtn.style.color = "white";
        removeBtn.style.border = "none";
        removeBtn.style.cursor = "pointer";
  
        removeBtn.onclick = () => {
          entry.images.splice(i, 1);
          renderImagePreviews();
        };
  
        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        imagePreviewDiv.appendChild(wrapper);
      });
    }
  
    function renderDisplay() {
        
        function parseLocalDate(dateString) {
            if (!dateString) return null;
            const parts = dateString.split("-");
            if (parts.length !== 3) return null;
          
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // zero-based month
            const day = parseInt(parts[2], 10);
          
            return new Date(year, month, day);
          }
          
          function formatDateToMMDDYYYY(dateString) {
            if (!dateString) return "";
          
            const d = parseLocalDate(dateString);
            if (!d || isNaN(d)) return dateString; // fallback
          
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const yyyy = d.getFullYear();
          
            return `${mm}/${dd}/${yyyy}`;
          }
          
          
        let html = "";
      
        if (entryType === "been") {
            html += `<p><strong>Date:</strong> ${formatDateToMMDDYYYY(entry.date) || "N/A"}</p>`;

          html += `
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${(entry.images || []).map(src => `<img src="${src}" style="width: 100px; border-radius: 4px;">`).join("")}
            </div>
          `;
          html += `<p><strong>Favorite Cities:</strong><br>${entry.favoriteCities || "None listed."}</p>`;
          html += `
        <p><strong>Story / Memories:</strong></p>
        <div class="story-container">
        <div class="story-text collapsed">${entry.story || "No information provided."}</div>
        <button class="toggle-story">Read more</button>
  </div>
`;

        } else {
          html += `<p><strong>Plans / Reasons to Visit:</strong><br>${entry.story || "No information provided."}</p>`;
        }
      
        displayDiv.innerHTML = html;

        const toggleBtn = displayDiv.querySelector(".toggle-story");
const storyText = displayDiv.querySelector(".story-text");

if (toggleBtn && storyText) {
  toggleBtn.addEventListener("click", () => {
    const expanded = storyText.classList.toggle("expanded");
    storyText.classList.toggle("collapsed", !expanded);
    toggleBtn.textContent = expanded ? "Show less" : "Read more";
  });
}


      }

  
    // Different placeholder text based on type
    if (entryType === "been") {
      storyBox.value = entry.story || "";
    } else if (entryType === "want") {
      storyBox.value = entry.story || "";
    }
  
    if (entryType === "been") {
        detailsDiv.appendChild(dateLabel);
        detailsDiv.appendChild(dateInput);
        detailsDiv.appendChild(citiesLabel);
        detailsDiv.appendChild(favoriteCitiesInput);
        detailsDiv.appendChild(imageLabel)
        detailsDiv.appendChild(imageInput);
        detailsDiv.appendChild(imagePreviewDiv);
      }
      detailsDiv.appendChild(storyLabel);
      detailsDiv.appendChild(storyBox);
      
    detailsDiv.appendChild(saveBtn);
  
    const displayDiv = document.createElement("div");
    displayDiv.style.display = "none";
    displayDiv.style.marginTop = "10px";
  
    renderDisplay();
  
    // Button behaviors
    expandBtn.onclick = () => {
      detailsDiv.style.display = "block";
      displayDiv.style.display = "none";
      expandBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
      editBtn.style.display = "none";
    };
  
    saveBtn.onclick = () => {
      entry.date = dateInput.value;
      entry.story = storyBox.value;
      if (entryType === "been") {
        entry.favoriteCities = favoriteCitiesInput.value;
      }
      
      saveEntries(entries);
  
      renderDisplay();
      detailsDiv.style.display = "none";
      displayDiv.style.display = "block";
  
      saveBtn.style.display = "none";
      editBtn.style.display = "inline-block";
      expandBtn.style.display = "none";
    };
  
    editBtn.onclick = () => {
      detailsDiv.style.display = "block";
      displayDiv.style.display = "none";
  
      saveBtn.style.display = "inline-block";
      editBtn.style.display = "none";
    };
  
    // Show edit by default if already filled
    const hasSaved = !!(entry.date || entry.images?.length || entry.story);
  
    if (hasSaved) {
      expandBtn.style.display = "none";
      editBtn.style.display = "inline-block";
      displayDiv.style.display = "block";
    }
  
    buttonGroup.appendChild(expandBtn);
    buttonGroup.appendChild(editBtn);
    buttonGroup.appendChild(delBtn);
    header.appendChild(buttonGroup);
  
    li.appendChild(header);
    li.appendChild(detailsDiv);
    li.appendChild(displayDiv);
  
    return li;
  }
  

  function updateEntryList(entries) {
    const beenList = document.getElementById("entries-list-been");
    const wantList = document.getElementById("entries-list-want");
    const showMoreBeen = document.getElementById("show-more-been");
    const showMoreWant = document.getElementById("show-more-want");
  
    [...beenList.children].forEach(child => {
      if (child.id !== "placeholder-been") beenList.removeChild(child);
    });
    [...wantList.children].forEach(child => {
      if (child.id !== "placeholder-want") wantList.removeChild(child);
    });
  
    // Clear show-more links
    showMoreBeen.innerHTML = "";
    showMoreWant.innerHTML = "";
  
    const beenEntries = entries.filter(e => e.type === "been");
    const wantEntries = entries.filter(e => e.type === "want");
  
    function renderList(listEl, showMoreEl, data, type) {
      const MAX = 3;
      const showAll = listEl.dataset.expanded === "true";
      const visibleEntries = showAll ? data.slice().reverse() : data.slice(-MAX).reverse();
  
      visibleEntries.forEach((entry, index) => {
        const li = createEntryElement(entry, index, entries, updateEntryList, type);
        listEl.appendChild(li);
      });
  
      if (data.length > MAX) {
        const toggle = document.createElement("a");
        toggle.href = "#";
        toggle.textContent = showAll ? "Show Less" : "Show More";
        toggle.onclick = (e) => {
          e.preventDefault();
          listEl.dataset.expanded = showAll ? "false" : "true";
          updateEntryList(entries);
        };
        showMoreEl.appendChild(toggle);
      }
    }
  
    renderList(beenList, showMoreBeen, beenEntries, "been");
    renderList(wantList, showMoreWant, wantEntries, "want");
  
    updateCountryTracker(entries);
    updatePlaceholders();
  }
  

  //country tracker

  function updateCountryTracker(entries) {
    const totalCountries = 195;
    const visitedCountries = new Set();
  
    entries.forEach(entry => {
      if (entry.type === "been" && entry.country) {
        visitedCountries.add(entry.country);
      }
    });
  
    const trackerDiv = document.getElementById("country-tracker");
    trackerDiv.textContent = `🌍 You've been to ${visitedCountries.size} out of ${totalCountries} countries`;
  }
  

  //badges section

  function createAchievementBadge(name) {
    const badge = document.createElement("div");
    badge.classList.add("badge");
    badge.textContent = `${name} Badge`;
  
    const icon = document.createElement("div");
    icon.classList.add("badge-icon");
    badge.prepend(icon);
  
    return badge;
  }
  
  function createBadge(name, type) {
    const badge = document.createElement("div");
    badge.classList.add("badge");
    if (type) badge.classList.add(type);
  
    const img = document.createElement("img");
img.classList.add("badge-icon");

// Map badge types or names to your PNG file names
const iconMap = {
  newbie: "Badge-2.png",
  explorer: "Badge-1.png",
  globetrotter: "Badge-4.png",
  collector: "Badge-3.png",
  country: "default-country.png"
};

img.src = `images/${iconMap[type] || iconMap["country"]}`;
img.alt = `${type} badge icon`;

badge.prepend(img);

  
    const text = document.createElement("span");
    text.textContent = name;
    badge.appendChild(text);
  
    const desc = document.createElement("div");
    desc.classList.add("badge-description");
    const badgeDescriptions = {
      "Newbie Badge": "You added your first country! Welcome to the adventure!",
      "Explorer Badge": "You've visited 5 countries! Keep exploring!",
      "Globetrotter Badge": "10 countries visited — you're a true globetrotter!",
      "Collector Badge": "20 countries! You're building quite a collection!",
      "country": "Congratulations! You have visited this country!"
    };
    desc.textContent = badgeDescriptions[name] || (type === "country" ? badgeDescriptions["country"] : "No description available.");
  badge.appendChild(desc);
  
    badge.addEventListener("click", () => {
      badge.classList.toggle("expanded");
    });
  
    return badge;
  }
    

  let userBadges = new Set();

  // Load badges user has seen before from localStorage
function loadShownBadges() {
    const stored = localStorage.getItem("shownBadges");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  }
  
  // Save badges user has seen to localStorage
  function saveShownBadges(badgesSet) {
    localStorage.setItem("shownBadges", JSON.stringify([...badgesSet]));
  }

  function generateBadges(entries) {
    const badgesContainer = document.getElementById("badges-container");

// Remove all badge elements but keep the placeholder intact
[...badgesContainer.children].forEach(child => {
  if (child.id !== "badges-placeholder") {
    badgesContainer.removeChild(child);
  }
});
  
    const uniqueCountries = new Set();
  
    entries.forEach(entry => {
      if (entry.type === "been") {
        const country = entry.country.trim();
        uniqueCountries.add(country);
      }
    });
  
    const badgesToShow = [];
  
    uniqueCountries.forEach(country => {
      badgesToShow.push(`${country} Badge`);
    });
  
    const total = uniqueCountries.size;
    if (total >= 1) badgesToShow.push("Newbie Badge");
    if (total >= 5) badgesToShow.push("Explorer Badge");
    if (total >= 10) badgesToShow.push("Globetrotter Badge");
    if (total >= 20) badgesToShow.push("Collector Badge");
  
    const shownBadges = loadShownBadges();
    const newBadges = new Set();
  
    badgesToShow.forEach(badge => {
      if (!shownBadges.has(badge)) {
        newBadges.add(badge);
      }
  
      let type = "country";
      const nameLower = badge.toLowerCase();
  
      if (nameLower.includes("newbie")) {
        type = "newbie";
      } else if (nameLower.includes("explorer")) {
        type = "explorer";
      } else if (nameLower.includes("globetrotter")) {
        type = "globetrotter";
      } else if (nameLower.includes("collector")) {
        type = "collector";
      }
  
      const badgeEl = createBadge(badge, type);
      badgesContainer.appendChild(badgeEl);
    });
  
    newBadges.forEach(badge => {
      showBadgeCongrats(badge);
      shownBadges.add(badge);
    });
  
    saveShownBadges(shownBadges);
  }
   
  

// Congratulation message + confetti
function showBadgeCongrats(badgeName) {


  let container = document.getElementById("congrats-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "congrats-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.background = "rgba(0,0,0,0.85)";
    container.style.color = "white";
    container.style.padding = "12px 24px";
    container.style.borderRadius = "12px";
    container.style.fontSize = "1.2rem";
    container.style.zIndex = 10000;
    container.style.textAlign = "center";
    container.style.minWidth = "280px";
    document.body.appendChild(container);
  }

  container.textContent = `🎉 Congratulations! You got the "${badgeName}"! 🎉`;

  // Simple badge descriptions
  const descriptions = {
    "Newbie Badge": "You added your first country! Welcome to the adventure.",
    "Explorer Badge": "You've visited 5 countries! Keep exploring!",
    "Globetrotter Badge": "10 countries visited — you're a true globetrotter!",
    "Collector Badge": "20 countries! You're building quite a collection!",
  };

  const descText = descriptions[badgeName] || "";

  if (descText) {
    const descEl = document.createElement("div");
    descEl.style.fontSize = "1rem";
    descEl.style.marginTop = "8px";
    descEl.textContent = descText;
    container.appendChild(descEl);
  }

  // Confetti effect
  if (window.confetti) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Remove message after 5 seconds
  setTimeout(() => {
    if (container) container.remove();
  }, 5000);
}

  

function clearMapHighlights() {
  highlightedLayers.forEach(layer => {
    map.removeLayer(layer);
  });
  highlightedLayers = [];
}

function handleEntry(type) {
    const input = document.getElementById("location");
    const country = input.value.trim();
    if (!country) return;
  
    const entries = JSON.parse(localStorage.getItem("travelEntries") || "[]");
  
    const feature = findCountryFeature(country);
    if (!feature) {
      alert("Country not found!");
      return;
    }
  
    // Get the official country name from GeoJSON feature
    const officialName = feature.properties.ADMIN || feature.properties.name || country;
  
    // Check if an entry with this official name already exists (case insensitive)
    const exists = entries.some(entry => entry.country.toLowerCase() === officialName.toLowerCase());

    const today = new Date();
const formattedDate = today.toISOString().split("T")[0]; // This gives "2025-07-19"


  
    // If trying to add "want" but country exists already, block it
    if (type === "want" && exists) {
      alert(`You already have an entry for "${officialName}"`);
      return;
    }
  
    // If adding to "been", remove any "want" entry for same official country name
    if (type === "been") {
      for (let i = entries.length - 1; i >= 0; i--) {
        if (
          entries[i].type === "want" &&
          entries[i].country.toLowerCase() === officialName.toLowerCase()
        ) {
          entries.splice(i, 1);
        }
      }
    }
  
    // Create the new entry using the official country name
    let entry;
    if (type === "been") {
      entry = {
        country: officialName,
        type,
        date: "",
        favoriteCities: "",
        story: "",
        images: []
      };
    } else {
      entry = {
        country: officialName,
        type,
        plan: ""
      };
    }
  
    entries.push(entry);
    saveEntries(entries);
  
    clearMapHighlights();
  
    // Re-highlight all entries after changes
    entries.forEach(e => {
      const f = findCountryFeature(e.country);
      if (f) highlightCountry(f, e.type);
    });
  
    if (type === "been") {
      generateBadges(entries);
    }
  
    updateEntryList(entries);
    input.value = "";
  }
  

  function updatePlaceholders() {
    const beenList = document.getElementById("entries-list-been");
    const wantList = document.getElementById("entries-list-want");
  
    const beenPlaceholder = document.getElementById("placeholder-been");
    const wantPlaceholder = document.getElementById("placeholder-want");
  
    const badgesContainer = document.getElementById("badges-container");
    const badgesPlaceholder = document.getElementById("badges-placeholder");
  
    // Count real list items (skip placeholder li)
    const beenEntries = [...beenList.children].filter(el => el.id !== "placeholder-been");
    const wantEntries = [...wantList.children].filter(el => el.id !== "placeholder-want");
    const badgeBubbles = [...badgesContainer.children].filter(el => el.id !== "badges-placeholder");
  
    beenPlaceholder.style.display = beenEntries.length === 0 ? "block" : "none";
    wantPlaceholder.style.display = wantEntries.length === 0 ? "block" : "none";
    badgesPlaceholder.style.display = badgeBubbles.length === 0 ? "block" : "none";
  }


document.getElementById("been-button").onclick = () => handleEntry("been");
document.getElementById("want-button").onclick = () => handleEntry("want");
