// Convoking4 Snapshot Assessment
// Version: 9.0 (Phase 2 - Modular)
// Date: August 20, 2025

(function() {
    // --- GLOBAL STATE ---
    let activeOrganization = null; // Stores the loaded parent organization data
    let currentAssessmentType = null; // 'organization' or 'undertaking'

    // --- DOM ELEMENTS ---
    const chooserView = document.getElementById('chooser-view');
    const appView = document.getElementById('app-view');
    const assessOrgButton = document.getElementById('assess-org-button');
    const assessUndertakingButton = document.getElementById('assess-undertaking-button');
    const briefingContainer = document.getElementById('briefing-document-container');
    const briefingContent = document.getElementById('briefing-document-content');
    
    const form = document.getElementById('profile-form');
    const formContainer = document.getElementById('dynamic-form-content');
    const navLinksContainer = document.getElementById('nav-links-container');
    const finalContainer = document.getElementById('questionnaire-and-validation-container');
    const saveButton = document.getElementById('generate-button');
    const clearButton = document.getElementById('clear-form-button');
    const orgFileLoader = document.getElementById('org-file-loader');
    
    let isDirty = false;
    let isRepopulating = false;

    // --- FORM FIELD FACTORY FUNCTIONS (reusable for both assessments) ---
    const createTextField = (id, title, description, rows = 3, path, example = '') => {
        return `<div class="form-group">
                    <label for="${id}" class="main-label">${title}</label>
                    ${description ? `<p class="description">${description}</p>` : ''}
                    ${example ? `<p class="option-example">${example}</p>` : ''}
                    <textarea id="${id}" rows="${rows}" data-path="${path}"></textarea>
                </div>`;
    };

    const createInputField = (id, title, description, path, example = '', type = 'text', attributes = {}) => {
        const attrString = Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ');
        return `<div class="form-group">
                    <label for="${id}" class="main-label">${title}</label>
                    ${description ? `<p class="description">${description}</p>` : ''}
                    ${example ? `<p class="option-example">${example}</p>` : ''}
                    <input type="${type}" id="${id}" data-path="${path}" ${attrString}>
                </div>`;
    };
    
    const createSelectField = (id, title, description, path, options, example = '') => {
        let optionsHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
        return `<div class="form-group">
                    <label for="${id}" class="main-label">${title}</label>
                    ${description ? `<p class="description">${description}</p>` : ''}
                    ${example ? `<p class="option-example">${example}</p>` : ''}
                    <select id="${id}" data-path="${path}">${optionsHTML}</select>
                </div>`;
    };

    const createMultiChoice = (id, title, description, type, options, path) => {
        let optionsHTML = options.map(opt => {
            const uniqueId = `${id}-${opt.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const optDescription = opt.description ? `<p class="option-description">${opt.description}</p>` : '';
            const showFor = opt.showFor ? `data-show-for="${opt.showFor.join(',')}"` : '';
            const containerClass = opt.showFor ? 'conditional-field' : '';

            return `<div class="input-group-container ${containerClass}" ${showFor}>
                        <div class="input-group">
                            <input type="${type}" id="${uniqueId}" name="${id}" value="${opt.label}" data-path="${path}">
                            <label for="${uniqueId}">${opt.label}</label>
                        </div>
                        ${optDescription}
                    </div>`;
        }).join('');

        return `<div class="form-group">
                    <label class="main-label">${title}</label>
                    ${description ? `<p class="description">${description}</p>` : ''}
                    <div class="${type}-group">${optionsHTML}</div>
                </div>`;
    };

    // --- ASSESSMENT BLUEPRINTS ---

    const organizationalSections = [
        // Using the comprehensive v8.2 structure
        {
            title: "Section 1: Basic Information", id: "section-basic-info", path: "basicInfo",
            description: "Start with the basics. This helps identify the organization and its context.",
            parts: [
                createInputField("org-name", "1.1 Organization Name", "", "basicInfo.organizationName", "", "text", {required: true}),
                createInputField("org-year", "1.2 Year Founded", "", "basicInfo.yearFounded", "", "number"),
                createInputField("org-city", "1.3 Primary City", "", "basicInfo.city"),
                createInputField("org-country", "1.4 Primary Country", "", "basicInfo.country"),
            ]
        },
        {
            title: "Section 2: Organization Identity", id: "section-identity", path: "identity",
            description: "Define the core operational, legal, and purposeful structure of your organization.",
            parts: [
                createMultiChoice("org-archetype", "2.1 Primary Organizational Archetype", "Select the option that best describes your organization's fundamental purpose.", "radio", [
                    {label: "For-Profit Business"}, {label: "Mission-Driven Organization"}, {label: "Member/Community-Based Organization"}, {label: "Hybrid Organization"}, {label: "Uncertain"}
                ], "identity.archetype"),
                createMultiChoice("funding-model", "2.2 Primary Funding Model", "How does your organization primarily finance its operations?", "radio", [
                    {label: "Revenue from Services/Products", showFor: ["For-Profit Business", "Hybrid Organization"]},
                    {label: "Donations/Grants", showFor: ["Mission-Driven Organization", "Hybrid Organization"]},
                    {label: "Membership Fees", showFor: ["Member/Community-Based Organization"]},
                    {label: "Bootstrapping", showFor: ["For-Profit Business"]},
                    {label: "Uncertain"}
                ], "identity.fundingModel"),
                createMultiChoice("legal-structure", "2.3 Legal Structure", "What is your organization's legal form?", "radio", [
                    {label: "LLC", showFor: ["For-Profit Business", "Hybrid Organization"]},
                    {label: "Corporation (C-Corp/S-Corp)", showFor: ["For-Profit Business", "Hybrid Organization"]},
                    {label: "Nonprofit/NGO", showFor: ["Mission-Driven Organization"]},
                    {label: "Pre-Formal/Informal"}, {label: "Uncertain"}
                ], "identity.legalStructure"),
            ]
        },
        // ... (other sections from v8.2 would go here)
    ];

    const undertakingSections = [
        {
            title: "Section 1: Undertaking Identity", id: "section-undertaking-id", path: "undertakingInfo",
            description: "Define the core purpose and goals of this specific project or initiative.",
            parts: [
                createInputField("undertaking-name", "1.1 Undertaking Name", "", "undertakingInfo.name", "e.g., Q3 Product Launch", "text", {required: true}),
                createTextField("undertaking-mission", "1.2 Mission Statement", "What is the core purpose of this undertaking? What problem does it solve?", 3, "undertakingInfo.mission"),
            ]
        },
        {
            title: "Section 2: Beneficiaries & Stakeholders", id: "section-undertaking-stakeholders", path: "undertakingStakeholders",
            description: "Define who this undertaking serves and who is involved in its success.",
            parts: [
                createTextField("beneficiaries", "2.1 Primary Beneficiaries", "Who will directly benefit from the success of this undertaking? (e.g., customers, community members, internal teams)", 3, "undertakingStakeholders.beneficiaries"),
                createTextField("key-stakeholders", "2.2 Key Stakeholders", "List the key people or teams whose support is critical for this undertaking to succeed.", 3, "undertakingStakeholders.keyStakeholders"),
            ]
        },
        {
            title: "Section 3: Project KPIs & Resources", id: "section-undertaking-kpis", path: "undertakingKpis",
            description: "Define how success will be measured and what resources are required.",
            parts: [
                createTextField("success-metrics", "3.1 Success Metrics", "List 2-3 specific, measurable KPIs for this undertaking.", 3, "undertakingKpis.successMetrics", "e.g., Achieve 500 new user sign-ups; Reduce customer support tickets by 15%"),
                createTextField("resources", "3.2 Required Resources", "What is the estimated budget, team, and timeline for this undertaking?", 3, "undertakingKpis.resources"),
            ]
        },
    ];

    // --- APPLICATION CONTROLLER LOGIC ---

    const initializeApp = () => {
        chooserView.classList.remove('hidden');
        appView.classList.add('hidden');

        assessOrgButton.addEventListener('click', () => {
            currentAssessmentType = 'organization';
            renderForm(organizationalSections);
        });

        assessUndertakingButton.addEventListener('click', () => {
            showNotification('Please load the parent Organizational Snapshot file.', 'info');
            orgFileLoader.click();
        });

        orgFileLoader.addEventListener('change', handleOrgFileLoadForUndertaking);
    };

    const renderForm = (sections) => {
        chooserView.classList.add('hidden');
        appView.classList.remove('hidden');

        const formHtml = [];
        const navHtml = [];
        sections.forEach(section => {
            const navTitle = section.title.includes(':') ? section.title.split(':')[1].trim() : section.title;
            formHtml.push(`<h2 id="${section.id}">${section.title}</h2>`);
            if (section.description) { formHtml.push(`<p class="section-explanation">${section.description}</p>`); }
            formHtml.push(`<fieldset>${section.parts.join('')}</fieldset>`);
            navHtml.push(`<li><a href="#${section.id}">${navTitle}</a></li>`);
        });
        
        formContainer.innerHTML = formHtml.join('');
        navLinksContainer.innerHTML = navHtml.join('');
        
        // Initialize dynamic elements like dropdowns if they exist in the rendered form
        updateKpiDropdowns();
    };

    const handleOrgFileLoadForUndertaking = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.metadata || !data.basicInfo) {
                    throw new Error("This does not appear to be a valid Organizational Snapshot file.");
                }
                activeOrganization = data;
                currentAssessmentType = 'undertaking';
                
                // For now, we just render the form. In a future step, we would load and display the AI diagnostic.
                renderForm(undertakingSections);
                showNotification(`Loaded context from "${activeOrganization.basicInfo.organizationName}". You can now begin the Undertaking Snapshot.`, 'success');

            } catch (error) {
                console.error('Error parsing organization file:', error);
                showNotification(error.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset file input
    };

    const saveProfileToFile = () => {
        const data = gatherFormData();
        let type, name, descriptor, date, fileName;

        if (currentAssessmentType === 'organization') {
            if (!data.basicInfo || !data.basicInfo.organizationName) {
                showNotification('Please enter an Organization Name first.', 'error');
                return;
            }
            type = 'org';
            name = data.basicInfo.organizationName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            descriptor = 'snapshot';
            date = new Date().toISOString().split('T')[0];
            fileName = `${type}_${name}_${descriptor}_${date}.json`;

        } else if (currentAssessmentType === 'undertaking') {
            if (!data.undertakingInfo || !data.undertakingInfo.name) {
                showNotification('Please enter an Undertaking Name first.', 'error');
                return;
            }
            // Add parent organization ID for linking
            if (activeOrganization && activeOrganization.metadata) {
                data.metadata.parentOrganizationId = activeOrganization.metadata.snapshotId || activeOrganization.basicInfo.organizationName;
            }
            type = 'undertaking';
            name = data.undertakingInfo.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            descriptor = 'snapshot';
            date = new Date().toISOString().split('T')[0];
            fileName = `${type}_${name}_${descriptor}_${date}.json`;
        }

        const fileContent = JSON.stringify(data, null, 2);
        const blob = new Blob([fileContent], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    const generateAIPrompt = () => {
        // This function will need to be updated to be context-aware
        // For now, it will generate a generic prompt
        const allData = gatherFormData();
        let promptTemplate = `Analyze the following snapshot data:\n\n${JSON.stringify(allData, null, 2)}`;

        if (currentAssessmentType === 'undertaking' && activeOrganization) {
            const orgSummary = {
                name: activeOrganization.basicInfo.organizationName,
                mission: activeOrganization.strategy?.missionStatement,
                headwind: activeOrganization.strategicMomentum?.headwind,
            };

            promptTemplate = `
[1.0 PERSONA & PRIME DIRECTIVE]
You are an AI Strategic Advisor. Your prime directive is to analyze the following Undertaking Snapshot within the context of its parent organization. Your primary goal is to identify potential misalignments between the project and the organization's broader strategy.

[2.0 DATA STREAM & CONTEXT]

[2.1 PARENT ORGANIZATION PROFILE (SUMMARY)]
<details><summary>View Parent Organization Data</summary>
- Name: ${orgSummary.name || 'N/A'}
- Mission: ${orgSummary.mission || 'N/A'}
- Stated Headwind: ${orgSummary.headwind || 'N/A'}
</details>

[2.2 UNDERTAKING PROFILE JSON]
<details><summary>View Undertaking Data</summary>
\`\`\`json
${JSON.stringify(allData, null, 2)}
\`\`\`
</details>

[4.0 OUTPUT PROTOCOL]
Generate a report focusing on:
1.  **Strategic Alignment Score (1-10):** How well does this undertaking align with the parent organization's stated mission and challenges?
2.  **Key Misalignments:** Identify 2-3 areas where the undertaking's goals or resource needs may conflict with the parent organization's reality.
3.  **Critical Questions:** List 3 pointed questions the project sponsor should be prepared to answer before seeking final approval.
`;
        }
        
        document.getElementById('ai-prompt-output').value = promptTemplate.trim();
        document.getElementById('ai-prompt-modal').showModal();
    };

    // --- Other helper functions (clearForm, setDirty, gatherFormData, etc.) ---
    // These functions are largely the same but may need minor tweaks for the new modular structure.
    // For brevity, a simplified set is included. The full, robust versions from v8.2 should be used.
    
    const gatherFormData = () => {
        const data = { metadata: { type: currentAssessmentType } };
        form.querySelectorAll('[data-path]').forEach(el => {
            const path = el.dataset.path;
            if (el.type === 'radio' && el.checked) {
                set(data, path, el.value);
            } else if (el.type === 'checkbox') {
                const currentVal = getValueFromPath(data, path) || [];
                if (el.checked && !currentVal.includes(el.value)) {
                    currentVal.push(el.value);
                }
                set(data, path, currentVal);
            } else if (el.value) {
                set(data, path, el.value);
            }
        });
        return data;
    };
    
    const set = (obj, path, value) => {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') { current[key] = {}; }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    };

    const getValueFromPath = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const updateKpiDropdowns = () => {
        // This function remains the same as v8.2
    };

    // --- EVENT LISTENERS ---
    saveButton.addEventListener('click', saveProfileToFile);
    document.querySelector('#consult-ai-button')?.addEventListener('click', generateAIPrompt);
    
    // --- INITIALIZATION ---
    initializeApp();

})();
