const categoriesList = [
    "action", "adventure", "anime", "comedy", "DILF", "dominant", "drama", "education", 
    "events", "fantasy", "femboy", "furry", "futanari", "gaming", "female", "male", 
    "giant", "kemono", "kuudere", "MILF", "monsters", "non-binary", "NTR", 
    "original character", "pov female", "pov male", "pov neutral", "robot", "roleplay", 
    "scenario", "sci-fi", "steampunk", "submissive", "suspense", "tomboys", "tsundere", 
    "vampire", "vtubers", "Yandere", "yaoi", "yuri"
];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize UI
    renderCategories();
    loadApiSettings();
    loadCharacterData();

    // 2. Modal Logic
    const modal = document.getElementById("apiModal");
    document.getElementById("apiSettingsBtn").onclick = () => modal.style.display = "block";
    document.getElementById("closeModal").onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

    // 3. Save API Settings
    document.getElementById("saveApiBtn").onclick = () => {
        const settings = {
            provider: document.getElementById("apiProvider").value,
            url: document.getElementById("apiUrl").value,
            key: document.getElementById("apiKey").value,
            model: document.getElementById("apiModel").value
        };
        localStorage.setItem("ai_api_settings", JSON.stringify(settings));
        alert("Settings Saved!");
        modal.style.display = "none";
    };

    // 4. Main AI Generation Logic
    document.getElementById("generateAiBtn").onclick = generateCharacter;

    // 5. Form Listeners for Live Preview
    document.querySelectorAll("input, textarea, select").forEach(input => {
        input.addEventListener("input", updateOutput);
    });
    document.getElementById("categoriesGrid").addEventListener("change", updateOutput);
    
    // 6. Action Buttons
    document.getElementById("copyBtn").onclick = copyToClipboard;
    document.getElementById("clearBtn").onclick = clearData;
});

// --- API HANDLING ---

async function generateCharacter() {
    const mainIdea = document.getElementById("mainIdeaInput").value;
    const settings = JSON.parse(localStorage.getItem("ai_api_settings"));

    if (!mainIdea) return alert("Please enter a main idea first!");
    if (!settings || !settings.url) return alert("Please configure your API Settings first (gear icon).");

    toggleLoading(true);

    const systemPrompt = `You are a Character Creator AI. Based on the user's idea, generate a full character profile. 
    You MUST respond ONLY with a JSON object. Do not write prose. 
    Fields: title, name, description, bg_story, app_hair, app_eye, app_body, app_clothes, app_accessories, personality (comma separated string), first_message, scenario, dialogue, custom_tags, categories (array of strings matching: ${categoriesList.join(', ')}).`;

    try {
        let response;
        const payload = {
            model: settings.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Create this character: ${mainIdea}` }
            ],
            temperature: 0.7
        };

        // Basic Fetch for OpenAI-compatible endpoints (OpenRouter, LM Studio, etc.)
        const res = await fetch(settings.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${settings.key}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        const content = data.choices[0].message.content;
        const parsedChar = JSON.parse(content.replace(/```json|```/g, "")); // Clean markdown if AI sends it

        fillForm(parsedChar);
    } catch (error) {
        console.error("AI Error:", error);
        alert("Failed to generate. Check console or API settings.");
    } finally {
        toggleLoading(false);
    }
}

// --- UTILITY FUNCTIONS ---

function fillForm(data) {
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

    // Handle Categories
    document.querySelectorAll(".cat-checkbox").forEach(cb => {
        cb.checked = data.categories && data.categories.includes(cb.value);
    });

    updateOutput();
}

function updateOutput() {
    const form = getFormData();
    saveCharacterData(form);

    const personaJSON = {
        background_story: form.bg_story,
        appearance: {
            hair: form.app_hair,
            eye: form.app_eye,
            body: form.app_body,
            clothes: form.app_clothes,
            accessories: form.app_accessories
        },
        personality: form.personality.split(',').map(p => p.trim()).filter(p => p)
    };

    const output = `Title: ${form.title}\nName: ${form.name}\nDescription: ${form.description}\n\n[Persona]\n${JSON.stringify(personaJSON, null, 2)}\n\n[First Message]\n${form.first_message}\n\n[Scenario]\n${form.scenario}\n\n[Example Dialogue]\n${form.dialogue}\n\nTags: ${form.custom_tags}\nCategories: ${form.selected_categories.join(", ")}\nAddition: ${form.addition}`;
    
    document.getElementById("outputPreview").textContent = output;
}

function getFormData() {
    const selected = Array.from(document.querySelectorAll(".cat-checkbox:checked")).map(cb => cb.value);
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
        selected_categories: selected
    };
}

function renderCategories() {
    const grid = document.getElementById("categoriesGrid");
    categoriesList.forEach(cat => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${cat}" class="cat-checkbox"> ${cat}`;
        grid.appendChild(label);
    });
}

function toggleLoading(isLoading) {
    document.getElementById("loadingIndicator").classList.toggle("hidden", !isLoading);
    document.getElementById("generateAiBtn").disabled = isLoading;
}

function loadApiSettings() {
    const saved = localStorage.getItem("ai_api_settings");
    if (saved) {
        const s = JSON.parse(saved);
        document.getElementById("apiProvider").value = s.provider;
        document.getElementById("apiUrl").value = s.url;
        document.getElementById("apiKey").value = s.key;
        document.getElementById("apiModel").value = s.model;
    }
}

function saveCharacterData(data) { localStorage.setItem("draft_char", JSON.stringify(data)); }

function loadCharacterData() {
    const saved = localStorage.getItem("draft_char");
    if (saved) fillForm(JSON.parse(saved));
}

function clearData() {
    if (confirm("Clear all?")) {
        localStorage.removeItem("draft_char");
        location.reload();
    }
}

function copyToClipboard() {
    navigator.clipboard.writeText(document.getElementById("outputPreview").textContent);
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Copied!";
    setTimeout(() => btn.textContent = "Copy Result", 2000);
}