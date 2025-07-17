// =====================
// 📦 Globals & Constants
// =====================
let allRecipes = [];

const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("search-suggestions");

// =====================
// 🌐 Fetch Data
// =====================
fetch('recipes.json')
  .then(response => response.json())
  .then(data => {
    allRecipes = data.meals;
    document.getElementById("userMood").value = "auto";
    renderRecipes(allRecipes, getCurrentMood());
  });


// =====================
// 🔍 Search + Suggestions
// =====================
searchInput.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const mood = getCurrentMood();

  const filtered = allRecipes.filter(recipe => {
    const nameMatch = recipe.strMeal.toLowerCase().includes(keyword);
    const ingredientMatch = getIngredientsList(recipe).some(ingredient =>
      ingredient.toLowerCase().includes(keyword)
    );
    return nameMatch || ingredientMatch;
  });

  renderRecipes(filtered, mood);
});


suggestionsList.addEventListener("click", function (e) {
  if (e.target.tagName === "LI") {
    const selectedText = e.target.textContent;
    searchInput.value = selectedText;

    const filtered = allRecipes.filter(recipe =>
      recipe.strMeal.toLowerCase().includes(selectedText.toLowerCase())
    );

    renderRecipes(filtered);
    suggestionsList.style.display = "none";
  }
});

// Hide suggestions on outside click
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    suggestionsList.style.display = "none";
  }
});

function detectMoodFromTime() {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) return "tired";
  if (hour >= 6 && hour < 10) return "lazy";
  if (hour >= 10 && hour < 16) return "adventurous";
  if (hour >= 16 && hour < 22) return "happy";
  return "neutral";
}

function getCurrentMood() {
  const mood = document.getElementById("userMood").value;
  return mood === "auto" ? detectMoodFromTime() : mood;
}


// =====================
// 🍳 Render Recipes Grid
// =====================
function renderRecipes(recipes, mood = "neutral") {
  const grid = document.getElementById("recipe-grid");
  grid.innerHTML = "";

  const moodFiltered = recipes.filter(recipe => {
    switch (mood) {
      case "happy":
        return recipe.strCategory?.includes("Dessert") || recipe.strTags?.toLowerCase()?.includes("sweet");
      case "sad":
        return recipe.strCategory?.includes("Soup") || recipe.strTags?.toLowerCase()?.includes("comfort");
      case "tired":
        return recipe.strTags?.toLowerCase()?.includes("easy") || recipe.strTags?.toLowerCase()?.includes("quick");
      case "adventurous":
        return recipe.strArea && !["American", "British"].includes(recipe.strArea);
      case "lazy":
        return recipe.strTags?.toLowerCase()?.includes("lazy") || recipe.strCategory?.includes("Snack");
      default:
        return true;
    }
  });

  moodFiltered.forEach((recipe) => {
    const col = document.createElement("div");
    col.className = "col-md-3 col-sm-6";

    col.innerHTML = `
      <div class="card recipe-card position-relative" data-id="${recipe.idMeal}">
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-img">
        <div class="recipe-overlay">${recipe.strMeal}</div>
        <div class="recipe-meta">
          <span>👨‍🍳 ${recipe.strArea || "Unknown"}</span>
          <span>⏰ 2h</span>
        </div>
        <div class="recipe-actions position-absolute top-0 end-0 m-2">
          <button class="btn btn-sm btn-light fav-btn" title="Favorite"><i class="bi bi-heart"></i></button>
          <button class="btn btn-sm btn-light done-btn ms-1" title="Mark as Done"><i class="bi bi-check2-circle"></i></button>
        </div>
      </div>
    `;

    const recipeCard = col.querySelector(".recipe-card");
    const favBtn = col.querySelector(".fav-btn");
    const doneBtn = col.querySelector(".done-btn");
    const recipeId = recipe.idMeal;

    // Prevent detail popup when clicking buttons
    recipeCard.addEventListener("click", (e) => {
      if (
        e.target.closest(".fav-btn") ||
        e.target.closest(".done-btn")
      ) return;
      showRecipeDetails(recipe);
    });

    // Load saved state
    const favorites = JSON.parse(localStorage.getItem("favoriteRecipes") || "[]");
    const completed = JSON.parse(localStorage.getItem("completedRecipes") || "[]");

    if (favorites.includes(recipeId)) {
      favBtn.classList.add("text-danger");
      favBtn.querySelector("i").classList.replace("bi-heart", "bi-heart-fill");
    }
    if (completed.includes(recipeId)) {
      doneBtn.classList.add("text-success");
    }

    // Favorite toggle
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let favs = JSON.parse(localStorage.getItem("favoriteRecipes") || "[]");
      const index = favs.indexOf(recipeId);

      if (index !== -1) {
        favs.splice(index, 1);
        favBtn.classList.remove("text-danger");
        favBtn.querySelector("i").classList.replace("bi-heart-fill", "bi-heart");
      } else {
        favs.push(recipeId);
        favBtn.classList.add("text-danger");
        favBtn.querySelector("i").classList.replace("bi-heart", "bi-heart-fill");
      }

      localStorage.setItem("favoriteRecipes", JSON.stringify(favs));

      // ✅ Update mission progress
      const mission = JSON.parse(localStorage.getItem("missionProgress") || "{}");
      mission.dailyFav = Math.min(favs.length, 2);
      localStorage.setItem("missionProgress", JSON.stringify(mission));
    });

    // Completed toggle
    doneBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      let done = JSON.parse(localStorage.getItem("completedRecipes") || "[]");
      const already = done.includes(recipeId);

      if (already) {
        done = done.filter(id => id !== recipeId);
        doneBtn.classList.remove("text-success");
      } else {
        done.push(recipeId);
        doneBtn.classList.add("text-success");

        const mission = JSON.parse(localStorage.getItem("missionProgress") || "{}");
        mission.dailyTry = Math.min((mission.dailyTry || 0) + 1, 3);
        mission.weeklyCook = Math.min((mission.weeklyCook || 0) + 1, 5);
        localStorage.setItem("missionProgress", JSON.stringify(mission));
      }

      localStorage.setItem("completedRecipes", JSON.stringify(done));
    });

    grid.appendChild(col);
  });
}

document.querySelectorAll('#my-recipes-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    const filterType = btn.getAttribute('data-filter');
    
    // 🔽 Add this to remove "active" from all buttons first
    document.querySelectorAll('#my-recipes-tabs button').forEach(b => b.classList.remove("active"));

    // ✅ Then add it to the clicked button
    btn.classList.add("active");

    // Filtering logic below...
    const completed = JSON.parse(localStorage.getItem("completedRecipes") || "[]");
    const favorites = JSON.parse(localStorage.getItem("favoriteRecipes") || "[]");

    let filtered = [];

    if (filterType === "completed") {
      filtered = allRecipes.filter(r => completed.includes(r.idMeal));
    } else if (filterType === "favorite") {
      filtered = allRecipes.filter(r => favorites.includes(r.idMeal));
    } else if (filterType === "both") {
      filtered = allRecipes.filter(r => completed.includes(r.idMeal) && favorites.includes(r.idMeal));
    } else {
      filtered = allRecipes;
    }

    renderRecipes(filtered);
  });
});




// =====================
// 📋 Show Recipe Details
// =====================
function showRecipeDetails(recipe) {
  const panel = document.getElementById("detail-panel");
  const overlay = document.getElementById("detail-overlay");
  const content = document.getElementById("detail-content");

  content.innerHTML = `
    <h2 class="mb-1">${recipe.strMeal}</h2>
    <div class="d-flex justify-content-between align-items-center text-muted mb-3 flex-wrap">
      <span>👨‍🍳 ${recipe.strArea} • ${recipe.strCategory}</span>
      <span class="fst-italic">${recipe.strTags || ''}</span>
    </div>

    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="img-fluid rounded detail-img mb-3">

    <!-- Tabs -->
    <ul class="nav nav-tabs" id="detailTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="ingredients-tab" data-bs-toggle="tab" data-bs-target="#ingredients" type="button" role="tab">🍴 Ingredients</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="instructions-tab" data-bs-toggle="tab" data-bs-target="#instructions" type="button" role="tab">👨‍🍳 Instructions</button>
      </li>
    </ul>

    <div class="tab-content pt-3">
      <div class="tab-pane fade show active" id="ingredients" role="tabpanel">
        <ul>
          ${getIngredientsList(recipe).map(item => `<li>${item}</li>`).join("")}
        </ul>
      </div>
      <div class="tab-pane fade" id="instructions" role="tabpanel">
        <ol>
          ${recipe.strInstructions.split('\r\n').map(step => `<li>${step.trim()}</li>`).join('')}
        </ol>
      </div>
    </div>
    <button class="btn btn-success mt-3" id="feed-pet-btn">
    🐾 Feed This to Your Pet
  </button> 
  `
  setTimeout(() => {
  const feedBtn = document.getElementById("feed-pet-btn");
  if (feedBtn) {
    feedBtn.addEventListener("click", () => feedPet(recipe));
  }

  // ✅ Track instructions tab click for weekly mission
  const instructionsTab = document.getElementById("instructions-tab");
  instructionsTab.addEventListener("click", () => {
    let progress = JSON.parse(localStorage.getItem("missionProgress") || "{}");
    progress.weeklyRead = Math.min((progress.weeklyRead || 0) + 1, 5);
    localStorage.setItem("missionProgress", JSON.stringify(progress));

    // Optional: Update progress bar live if mission panel is open
    const bar = document.getElementById("weekly-read");
    if (bar) {
      const percent = Math.min((progress.weeklyRead / 5) * 100, 100);
      bar.style.width = `${percent}%`;
      bar.textContent = `${progress.weeklyRead} / 5`;
    }
  });

}, 0);


  panel.classList.add("show");
  overlay.classList.add("show");
}

// =====================
// 🔙 Close Detail Panel
// =====================
function closeDetailPanel() {
  document.getElementById("detail-panel").classList.remove("show");
  document.getElementById("detail-overlay").classList.remove("show");
}

document.getElementById("close-panel").addEventListener("click", closeDetailPanel);
document.getElementById("detail-overlay").addEventListener("click", closeDetailPanel);

// ✅ Prevent crashing when button doesn't exist yet
const feedBtn = document.getElementById("feed-pet-btn");
if (feedBtn) {
  feedBtn.addEventListener("click", () => feedPet(recipe));
}


// =====================
// 🧂 Ingredients Helper
// =====================
function getIngredientsList(recipe) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];
    if (ingredient && ingredient.trim() !== "") {
      ingredients.push(`${measure} ${ingredient}`.trim());
    }
  }
  return ingredients;
}

// Get the button
const scrollToTopBtn = document.getElementById("scrollToTopBtn");

// Show the button when the user scrolls down 100px from the top
window.onscroll = function () {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    scrollToTopBtn.style.visibility = "visible";  // Make button visible
    setTimeout(() => scrollToTopBtn.style.opacity = "1", 10); // Fade in effect with a slight delay
  } else {
    scrollToTopBtn.style.opacity = "0"; // Fade out effect
    setTimeout(() => scrollToTopBtn.style.visibility = "hidden", 300); // Hide button after fade-out
  }
};

// When the button is clicked, scroll to the top
scrollToTopBtn.addEventListener("click", function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

// loading screen
window.addEventListener("load", () => {
  const loader = document.getElementById("loading-screen");
  if (loader) {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  }
});


// =====================
// 🐾 Persistent Pet Setup
// =====================
const defaultPet = {
  name: "Chefie",
  mood: "Happy",
  level: 1,
  xp: 0,
  img: {
    Happy: "pet_happy.gif",
    Excited: "pet_excited.gif",
    Full: "pet_full.gif",
    Sleepy: "pet_sleepy.gif"
  }
};

// Load saved or use default
let petData;
const saved = localStorage.getItem("petData");
if (saved) {
  try {
    petData = JSON.parse(saved);
    // Patch missing fields (in case new moods/images added later)
    petData.img = Object.assign({}, defaultPet.img, petData.img);
  } catch (e) {
    petData = defaultPet;
  }
} else {
  petData = defaultPet;
}



// Update pet UI
function updatePetUI() {
  document.getElementById("pet-img").src = petData.img[petData.mood];
  document.getElementById("pet-name").textContent = petData.name;
  document.getElementById("pet-mood").textContent = petData.mood;

  document.getElementById("pet-panel-img").src = petData.img[petData.mood];
  document.getElementById("pet-panel-name").textContent = petData.name;
  document.getElementById("pet-panel-mood").textContent = petData.mood;
  document.getElementById("pet-panel-level").textContent = petData.level;
  document.getElementById("pet-panel-xp").textContent = `${petData.xp} XP`;

  // ✅ XP Bar Progress
  const xpPercent = (petData.xp / 100) * 100;
  document.getElementById("pet-xp-bar").style.width = `${xpPercent}%`;
}



// Save pet to localStorage
function savePet() {
  localStorage.setItem("petData", JSON.stringify(petData));
}

// 🧁 Feed pet logic
function feedPet(recipe) {
  petData.xp += 20;

  // Update mission progress
  const mission = JSON.parse(localStorage.getItem("missionProgress") || "{}");
  mission.weeklyFeed = (mission.weeklyFeed || 0) + 1;

  if (petData.xp >= 100) {
    petData.level++;
    petData.xp = 0;
    mission.dailyLevel = 1; // ✅ Max is 1
    setMood("Excited");
  } else {
    setMood("Full");
  }

  updatePetUI();
  localStorage.setItem("petData", JSON.stringify(petData));
  localStorage.setItem("missionProgress", JSON.stringify(mission));
}


let moodTimeout;

function setMood(mood) {
  petData.mood = mood;
  updatePetUI();
  localStorage.setItem("petData", JSON.stringify(petData));

  if (moodTimeout) clearTimeout(moodTimeout);

  let delay;

  switch (mood) {
    case "Excited":
      delay = 12000; // 12 seconds
      break;
    case "Full":
      delay = 10000; // 10 seconds
      break;
    case "Sleepy":
      delay = 15000; // 15 seconds
      break;
    default:
      return; // Don't revert "Happy" or unknown moods
  }

  moodTimeout = setTimeout(() => {
    petData.mood = "Happy";
    updatePetUI();
    localStorage.setItem("petData", JSON.stringify(petData));
  }, delay);
}




// 🐣 Open Pet Modal
document.addEventListener("DOMContentLoaded", () => {
  const petWidget = document.getElementById("pet-widget");

  petWidget.addEventListener("click", () => {
    updatePetUI();
    const modal = new bootstrap.Modal(document.getElementById("petModal"));
    modal.show();
  });

  if (saved) Object.assign(petData, JSON.parse(saved));
updatePetUI();

});

document.getElementById("userMood").addEventListener("change", () => {
  const mood = getCurrentMood();
  renderRecipes(allRecipes, mood);
});



// =====================
// 🎯 Mission Panel Toggle
// =====================
const missionPanel = document.getElementById("mission-panel");
const missionOverlay = document.getElementById("mission-overlay");
const missionContent = document.getElementById("mission-content");
const closeMissionBtn = document.getElementById("close-mission-panel");

document.querySelectorAll("#sidebar-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-tab");

    // Load content dynamically if needed
    if (tab === "daily-mission") {
  missionContent.innerHTML = `
    <h5 class="mb-3">🔥 Daily Missions</h5>

    <p>✅ Try 3 new recipes</p>
    <div class="progress mb-3">
      <div class="progress-bar bg-success" id="daily-try" role="progressbar" style="width: 0%;">0 / 3</div>
    </div>

    <p>❤️ Favorite 2 meals</p>
    <div class="progress mb-3">
      <div class="progress-bar bg-danger" id="daily-fav" role="progressbar" style="width: 0%;">0 / 2</div>
    </div>

    <p>📈 Level up your pet</p>
    <div class="progress mb-3">
      <div class="progress-bar bg-info" id="daily-level" role="progressbar" style="width: 0%;">0 / 1</div>
    </div>
  `;
} else if (tab === "weekly-mission") {
  missionContent.innerHTML = `
    <h5 class="mb-3">📆 Weekly Missions</h5>

    <p>🍲 Cook 5 unique dishes</p>
    <div class="progress mb-3">
      <div class="progress-bar bg-success" id="weekly-cook" role="progressbar" style="width: 0%;">0 / 5</div>
    </div>

    <p>📚 Read 5 instructions</p>
    <div class="progress mb-3">
      <div class="progress-bar bg-warning" id="weekly-read" role="progressbar" style="width: 0%;">0 / 5</div>
    </div>

    <p>💚 Feed pet 10 times</p>
    <div class="progress mb-3">
      <div class="progress-bar bg-info" id="weekly-feed" role="progressbar" style="width: 0%;">0 / 10</div>
    </div>
  `;
}

// Sample progress (replace with real data later!)
const stored = JSON.parse(localStorage.getItem("missionProgress") || "{}");
const progress = Object.assign({
  dailyTry: 0,
  dailyFav: 0,
  dailyLevel: 0,
  weeklyCook: 0,
  weeklyRead: 0,
  weeklyFeed: 0
}, stored);

localStorage.setItem("missionProgress", JSON.stringify(progress));

// Update bars
function updateMissionBars() {
  const setProgress = (id, current, total) => {
    const bar = document.getElementById(id);
    if (!bar) return;
    const percent = Math.min((current / total) * 100, 100);
    bar.style.width = `${percent}%`;
    bar.textContent = `${current} / ${total}`;
  };

  setProgress("daily-try", progress.dailyTry, 3);
  setProgress("daily-fav", progress.dailyFav, 2);
  setProgress("daily-level", progress.dailyLevel, 1);

  setProgress("weekly-cook", progress.weeklyCook, 5);
  setProgress("weekly-read", progress.weeklyRead, 5);
  setProgress("weekly-feed", progress.weeklyFeed, 10);
}

// Call after panel opens (short delay ensures DOM is ready)
setTimeout(updateMissionBars, 100);


    // Show panel & overlay
    missionPanel.style.transform = "translateX(0)";
    missionOverlay.style.display = "block";
  });
});

// Close button and overlay click
closeMissionBtn.addEventListener("click", closeMissionPanel);
missionOverlay.addEventListener("click", closeMissionPanel);

function closeMissionPanel() {
  missionPanel.style.transform = "translateX(100%)";
  missionOverlay.style.display = "none";
}





