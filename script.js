// Convoking4 Organizational Snapshot Assessment
// Version: 8.2 (Comprehensive)
// Date: August 20, 2025

(function() {
    const APP_VERSION = '8.2 (Comprehensive)';
    const form = document.getElementById('profile-form');
    const formContainer = document.getElementById('dynamic-form-content');
    const navLinksContainer = document.getElementById('nav-links-container');
    const saveButton = document.getElementById('generate-button');
    const clearButton = document.getElementById('clear-form-button');
    const topBar = document.querySelector('.top-bar');
    let scrollMarginStyleElement = null;
    let isDirty = false;
    let isRepopulating = false;

    // --- FORM FIELD FACTORY FUNCTIONS ---
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
        let optionsHTML = '<option value="">Select...</option>' + options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
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

    const createSlider = (id, title, description, path, minLabel = 'Low', maxLabel = 'High') => {
        return `<div class="form-group">
                    <label for="${id}" class="main-label">${title}</label>
                    ${description ? `<p class="description">${description}</p>` : ''}
                    <div class="slider-container">
                        <span class="slider-label">${minLabel}</span>
                        <input type="range" id="${id}" min="1" max="10" value="5" class="confidence-slider" data-path="${path}">
                        <span class="slider-label">${maxLabel}</span>
                    </div>
                </div>`;
    };

    // --- VERSION 8.2 (COMPREHENSIVE) FORM BLUEPRINT ---
    const sections = [
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
        {
            title: "Section 3: Core Strategy", id: "section-strategy", path: "strategy",
            description: "Define your organization's strategic direction.",
            parts: [
                 createTextField("mission-statement", "3.1 Mission Statement", "Your 'Why'. What is your organization's core purpose?", 3, "strategy.missionStatement"),
                 createTextField("core-values", "3.2 Core Values & a Recent Example", "For one of your core values, describe a specific, recent example of how the team lived (or failed to live) that value.", 4, "strategy.valuesAndBehaviors", "Example: Value: Customer Obsession. Behavior: An engineer stayed up all night to fix a single customer's critical bug."),
            ]
        },
        {
            title: "Section 4: Key Performance Indicators (KPIs)", id: "section-kpis", path: "kpis",
            description: "Strategy without data is speculation. Provide core metrics to create a quantitative baseline.",
            parts: [
                createMultiChoice("financial-metrics-checkboxes", "4.1 Financial Metrics", "Select all relevant financial indicators.", "checkbox", [
                    {label: "Annual Recurring Revenue (ARR)"}, {label: "Monthly Burn Rate"}, {label: "Cash Runway (Months)"}, {label: "LTV:CAC Ratio"}, {label: "Gross Margin"}
                ], "kpis.financialMetrics"),
                createSelectField("important-financial-metric-select", "Of those, which is the SINGLE most important financial metric right now?", "", "kpis.mostImportantFinancial", []),
                createMultiChoice("customer-metrics-checkboxes", "4.2 Customer Metrics", "Select all relevant customer health indicators.", "checkbox", [
                    {label: "Active Users/Customers"}, {label: "Churn Rate (%)"}, {label: "Net Promoter Score (NPS)"}, {label: "Customer Satisfaction (CSAT)"}, {label: "Customer Retention Rate"}
                ], "kpis.customerMetrics"),
                createSelectField("important-customer-metric-select", "Of those, which is the SINGLE most important customer metric right now?", "", "kpis.mostImportantCustomer", [])
            ]
        }
    ];

    // --- DYNAMICALLY BUILD THE FORM AND NAV ---
    const formHtml = [];
    const navHtml = [];
    sections.forEach(section => {
        const criticalIcon = section.isCritical ? '🧠 ' : '';
        formHtml.push(`<h2 id="${section.id}">${criticalIcon} ${section.title}</h2>`);
        if (section.description) { formHtml.push(`<p class="section-explanation">${section.description}</p>`); }
        formHtml.push(`<fieldset>`);
        formHtml.push(section.parts.join(''));
        if (section.changesPrompt) {
             formHtml.push(createTextField(`${section.id}-changes`, section.changesPrompt, "", 2, `${section.path}.recentChanges`));
        }
         if (section.goalsPrompt) {
             formHtml.push(createTextField(`${section.id}-goals`, section.goalsPrompt, "", 2, `${section.path}.futureGoals`));
        }
        formHtml.push(`</fieldset>`);
        const navTitle = section.title.includes(':') ? section.title.split(':')[1].trim() : section.title;
        navHtml.push(`<li><a href="#${section.id}">${navTitle}</a></li>`);
    });
    
    formContainer.innerHTML = formHtml.join('');
    navLinksContainer.innerHTML = navHtml.join('');

    // --- CORE APP LOGIC ---
    const handleArchetypeChange = () => {
        const selectedArchetype = form.querySelector('input[name="org-archetype"]:checked')?.value;
        const conditionalFields = form.querySelectorAll('.conditional-field');
        conditionalFields.forEach(field => {
            const showFor = field.dataset.showFor ? field.dataset.showFor.split(',') : [];
            if (!selectedArchetype || showFor.length === 0 || showFor.includes(selectedArchetype)) {
                field.classList.add('visible');
            } else {
                field.classList.remove('visible');
                field.querySelectorAll('input, select, textarea').forEach(input => {
                    if(input.type !== 'radio' && input.type !== 'checkbox') input.value = '';
                    else input.checked = false;
                });
            }
        });
    };

    const updateKpiDropdowns = () => {
        const financialCheckboxes = form.querySelectorAll('input[name="financial-metrics-checkboxes"]:checked');
        const financialSelect = document.getElementById('important-financial-metric-select');
        if (!financialSelect) return;
        const currentFinancialValue = financialSelect.value;
        let financialOptions = '<option value="">Select the most important...</option>';
        let valueStillExists = false;
        financialCheckboxes.forEach(checkbox => {
            financialOptions += `<option value="${checkbox.value}">${checkbox.value}</option>`;
            if (checkbox.value === currentFinancialValue) {
                valueStillExists = true;
            }
        });
        financialSelect.innerHTML = financialOptions;
        if (valueStillExists) {
            financialSelect.value = currentFinancialValue;
        }

        const customerCheckboxes = form.querySelectorAll('input[name="customer-metrics-checkboxes"]:checked');
        const customerSelect = document.getElementById('important-customer-metric-select');
        if (!customerSelect) return;
        const currentCustomerValue = customerSelect.value;
        let customerOptions = '<option value="">Select the most important...</option>';
        let customerValueExists = false;
        customerCheckboxes.forEach(checkbox => {
            customerOptions += `<option value="${checkbox.value}">${checkbox.value}</option>`;
            if (checkbox.value === currentCustomerValue) {
                customerValueExists = true;
            }
        });
        customerSelect.innerHTML = customerOptions;
        if (customerValueExists) {
            customerSelect.value = currentCustomerValue;
        }
    };

    const clearForm = () => {
        if (confirm("Are you sure you want to clear all fields? This action cannot be undone.")) {
            localStorage.removeItem('convoking4_autosave_v8_2');
            form.reset();
            handleArchetypeChange();
            updateKpiDropdowns();
            showNotification('Form cleared.', 'success');
            window.scrollTo(0, 0);
        }
    };

    const setDirty = (state) => {
        if (isDirty === state) return;
        isDirty = state;
        saveButton.textContent = state ? 'Save Snapshot to File (.json) *' : 'Save Snapshot to File (.json)';
        saveButton.classList.toggle('is-dirty', state);
    };

    const showNotification = (message, type = 'success', onClick = null) => {
        const banner = document.getElementById('notification-banner');
        banner.textContent = message;
        banner.className = `is-visible is-${type}`;
        banner.onclick = onClick;
        const timeout = onClick ? 6000 : 3000;
        setTimeout(() => { banner.className = ''; banner.onclick = null; }, timeout);
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
    
    const gatherFormData = () => {
        const data = { metadata: { version: APP_VERSION, generatedAt: new Date().toISOString() } };
        const checkboxPaths = new Set();
        form.querySelectorAll('input[type="checkbox"][data-path]').forEach(el => checkboxPaths.add(el.dataset.path));
        checkboxPaths.forEach(path => set(data, path, []));

        form.querySelectorAll('[data-path]').forEach(el => {
            const path = el.dataset.path;
            if (el.type === 'radio') {
                if (el.checked && el.value) set(data, path, el.value);
            } else if (el.type === 'checkbox') {
                if (el.checked) {
                    const currentVal = getValueFromPath(data, path) || [];
                    if (!currentVal.includes(el.value)) currentVal.push(el.value);
                    set(data, path, currentVal);
                }
            } else if (el.tagName.toLowerCase() === 'select') {
                if (el.value) set(data, path, el.value);
            } else if (el.value) {
                set(data, path, el.value);
            }
        });
        return data;
    };

    const repopulateForm = (data) => {
        isRepopulating = true;
        form.reset();
        const paths = {};
        const recurse = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                const newPrefix = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) { recurse(value, newPrefix); } else { paths[newPrefix] = value; }
            });
        };
        recurse(data);
        
        Object.keys(paths).forEach(path => {
            const value = paths[path];
            const elements = form.querySelectorAll(`[data-path="${path}"]`);
            elements.forEach(el => {
                if (el.type === 'radio') {
                    if (el.value === value) el.checked = true;
                } else if (el.type === 'checkbox') {
                    form.querySelectorAll(`[data-path="${path}"]`).forEach(cb => cb.checked = false);
                    if (Array.isArray(value)) {
                        value.forEach(v => {
                            if(el.value === v) el.checked = true;
                        });
                    }
                } else {
                    el.value = value || '';
                }
            });
        });

        handleArchetypeChange();
        updateKpiDropdowns();
        isRepopulating = false;
        setDirty(false);
    };

    const saveStateToLocalStorage = () => { if (isDirty) localStorage.setItem('convoking4_autosave_v8_2', JSON.stringify(gatherFormData())); };

    const loadStateFromLocalStorage = () => {
        const savedData = localStorage.getItem('convoking4_autosave_v8_2');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                repopulateForm(data);
                showNotification('Unsaved progress from a previous session has been restored.', 'info');
            } catch (e) {
                console.error("Could not parse autosaved data.", e);
                localStorage.removeItem('convoking4_autosave_v8_2');
            }
        }
    };

    const saveProfileToFile = () => {
        try {
            const data = gatherFormData();
            if (!data.basicInfo || !data.basicInfo.organizationName) {
                showNotification('Please enter an Organization Name first.', 'error');
                document.getElementById('org-name').focus();
                return;
            }
            const type = 'org';
            const orgName = data.basicInfo.organizationName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const descriptor = 'snapshot';
            const date = new Date().toISOString().split('T')[0];
            const fileName = `${type}_${orgName}_${descriptor}_${date}.json`;
            
            const fileContent = JSON.stringify(data, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            setDirty(false);
            showNotification('Profile saved successfully!', 'success
