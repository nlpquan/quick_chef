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
    renderRecipes(allRecipes);
  });

// =====================
// 🔍 Search + Suggestions
// =====================
searchInput.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();

  const filtered = allRecipes.filter(recipe => {
    const nameMatch = recipe.strMeal.toLowerCase().includes(keyword);
    const ingredientMatch = getIngredientsList(recipe).some(ingredient =>
      ingredient.toLowerCase().includes(keyword)
    );
    return nameMatch || ingredientMatch;
  });

  // Show dropdown suggestions (max 5)
  if (keyword.length > 0) {
    const suggestions = filtered.slice(0, 5).map(recipe => `
      <li class="list-group-item">${recipe.strMeal}</li>
    `).join("");

    suggestionsList.innerHTML = suggestions;
    suggestionsList.style.display = "block";
  } else {
    suggestionsList.style.display = "none";
  }

  renderRecipes(filtered);
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

// =====================
// 🍳 Render Recipes Grid
// =====================
function renderRecipes(recipes) {
  const grid = document.getElementById("recipe-grid");
  grid.innerHTML = "";

  recipes.forEach((recipe) => {
    const col = document.createElement("div");
    col.className = "col-md-3 col-sm-6";

    col.innerHTML = `
      <div class="card recipe-card" data-id="${recipe.idMeal}">
        <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-img">
        <div class="recipe-overlay">${recipe.strMeal}</div>
        <div class="recipe-meta">
          <span>👨‍🍳 ${recipe.strArea || "Unknown"}</span>
          <span>⏰ 2h</span>
        </div>
      </div>
    `;

    col.querySelector(".recipe-card").addEventListener("click", () =>
      showRecipeDetails(recipe)
    );

    grid.appendChild(col);
  });
}

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
  `;

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

