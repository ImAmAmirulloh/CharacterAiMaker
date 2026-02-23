const categoriesList = [
    "action", "adventure", "anime", "comedy", "DILF", "dominant", "drama", "education", 
    "events", "fantasy", "femboy", "furry", "futanari", "gaming", "female", "male", 
    "giant", "kemono", "kuudere", "MILF", "monsters", "non-binary", "NTR", 
    "original character", "pov female", "pov male", "pov neutral", "robot", "roleplay", 
    "scenario", "sci-fi", "steampunk", "submissive", "suspense", "tomboys", "tsundere", 
    "vampire", "vtubers", "Yandere", "yaoi", "yuri"
];

const mockNames = ["Aeliana", "Kaelen", "Nyx", "Orion", "Seraphina", "Darius", "Lyra", "Zephyr", "Ronin", "Silas"];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Render Categories
    const categoriesGrid = document.getElementById("categoriesGrid");
    categoriesList.forEach(cat => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${cat}" class="cat-checkbox"> ${cat}`;
        categoriesGrid.appendChild(label);
    });

    const formInputs = document.querySelectorAll("input, textarea");
    const checkboxes = document.querySelectorAll(".cat-checkbox");

    // 2. Load from LocalStorage
    loadData();

    // 3. Event Listeners for real-time updates and saving
    formInputs.forEach(input => {
        input.addEventListener("input", updateOutput);
    });
    
    // Checkboxes require a specific event listener
    document.getElementById("categoriesGrid").addEventListener("change", updateOutput);

    // 4. Buttons
    document.getElementById("copyBtn").addEventListener("click", copyToClipboard);
    document.getElementById("clearBtn").addEventListener("click", clearData);
    document.getElementById("suggestNameBtn").addEventListener("click", suggestName);

    // Initial render
    updateOutput();
});

function updateOutput() {
    const data = getFormData();
    saveData(data); // Save to local storage on every change

    // Construct Persona JSON
    const personaJSON = {
        background_story: data.bg_story,
        appearance: {
            hair: data.app_hair,
            eye: data.app_eye,
            body: data.app_body,
            clothes: data.app_clothes,
            accessories: data.app_accessories
        },
        personality: data.personality.split(',').map(p => p.trim()).filter(p => p)
    };

    // Format the final string
    const finalOutput = `Title: ${data.title}
Name: ${data.name}
Description: ${data.description}

[Persona]
${JSON.stringify(personaJSON, null, 2)}

[First Message]
${data.first_message}

[Scenario]
${data.scenario}

[Example Dialogue]
${data.dialogue}

Tags: ${data.custom_tags}
Categories: ${data.selected_categories.join(", ")}
Additional Notes: ${data.addition}
`;

    document.getElementById("outputPreview").textContent = finalOutput;
}

function getFormData() {
    const selected_categories = Array.from(document.querySelectorAll(".cat-checkbox:checked")).map(cb => cb.value);
    
    return {
        title: document.getElementById("title").value,
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        bg_story: document.getElementById("bg_story").value,
        app_hair: document.getElementById("app_hair").value,
        app_eye: document.getElementById("app_eye").value,
        app_body: document.getElementById("app_body").value,
        app_clothes: document.getElementById("app_clothes").value,
        app_accessories: document.getElementById("app_accessories").value,
        personality: document.getElementById("personality").value,
        first_message: document.getElementById("first_message").value,
        scenario: document.getElementById("scenario").value,
        dialogue: document.getElementById("dialogue").value,
        custom_tags: document.getElementById("custom_tags").value,
        addition: document.getElementById("addition").value,
        selected_categories: selected_categories
    };
}

function saveData(data) {
    localStorage.setItem("charAiMakerData", JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem("charAiMakerData");
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById("title").value = data.title || "";
        document.getElementById("name").value = data.name || "";
        document.getElementById("description").value = data.description || "";
        document.getElementById("bg_story").value = data.bg_story || "";
        document.getElementById("app_hair").value = data.app_hair || "";
        document.getElementById("app_eye").value = data.app_eye || "";
        document.getElementById("app_body").value = data.app_body || "";
        document.getElementById("app_clothes").value = data.app_clothes || "";
        document.getElementById("app_accessories").value = data.app_accessories || "";
        document.getElementById("personality").value = data.personality || "";
        document.getElementById("first_message").value = data.first_message || "";
        document.getElementById("scenario").value = data.scenario || "";
        document.getElementById("dialogue").value = data.dialogue || "";
        document.getElementById("custom_tags").value = data.custom_tags || "";
        document.getElementById("addition").value = data.addition || "";

        // Checkboxes
        if (data.selected_categories) {
            document.querySelectorAll(".cat-checkbox").forEach(cb => {
                if (data.selected_categories.includes(cb.value)) {
                    cb.checked = true;
                }
            });
        }
    }
}

function clearData() {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
        localStorage.removeItem("charAiMakerData");
        document.getElementById("charForm").reset();
        document.querySelectorAll(".cat-checkbox").forEach(cb => cb.checked = false);
        updateOutput();
    }
}

function copyToClipboard() {
    const text = document.getElementById("outputPreview").textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("copyBtn");
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy Result", 2000);
    });
}

function suggestName() {
    // Simple array randomization. If you want true AI, you would hook up a fetch request to an LLM API here.
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    document.getElementById("name").value = randomName;
    document.getElementById("nameSuggestion").textContent = "Suggested: " + randomName;
    updateOutput();
}