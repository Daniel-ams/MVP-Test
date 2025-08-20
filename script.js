// Convoking4 Organizational Snapshot Assessment
// Version: 8.2 (Comprehensive)
// Date: August 20, 2025

(function() {
    const APP_VERSION = '8.2 (Comprehensive)';
    const form = document.getElementById('profile-form');
    const formContainer = document.getElementById('dynamic-form-content');
    const navLinksContainer = document.getElementById('nav-links-container');
    const finalContainer = document.getElementById('questionnaire-and-validation-container');
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

    const createRankedChoice = (id, title, description, options, path) => {
        let optionsHTML = options.map(opt => {
            const uniqueId = `${id}-${opt.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            return `<div class="input-group-container">
                        <div class="input-group">
                            <input type="number" class="rank-input" min="1" max="${options.length}" data-rank-value="${opt.label}">
                            <label for="${uniqueId}" class="rank-label">${opt.label}</label>
                        </div>
                    </div>`;
        }).join('');

        return `<div class="form-group">
                    <label class="main-label">${title}</label>
                    ${description ? `<p class="description">${description}</p>` : ''}
                    <div class="rank-choice-group" data-rank-path="${path}">${optionsHTML}</div>
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
            changesPrompt: "Any recent changes to your organization's name, location, or founding team?",
            goalsPrompt: "What is your primary goal related to your basic identity? (e.g., formalize incorporation, establish a new HQ)",
            parts: [
                createInputField("org-name", "1.1 Organization Name", "", "basicInfo.organizationName", "Example: HealthyCare Clinic", "text", {required: true}),
                createInputField("org-year", "1.2 Year Founded", "", "basicInfo.yearFounded", "Example: 2015", "number", {min: "1800", max: new Date().getFullYear()}),
                createInputField("org-city", "1.3 Primary City", "", "basicInfo.city", "Example: Raleigh"),
                createInputField("org-country", "1.4 Primary Country", "", "basicInfo.country", "Example: United States"),
            ]
        },
        {
            title: "Section 2: Organization Identity", id: "section-identity", path: "identity",
            description: "Define the core operational, legal, and purposeful structure of your organization.",
            changesPrompt: "Have there been any recent shifts in your legal structure, funding model, or target scale?",
            goalsPrompt: "What is your top goal related to your identity? (e.g., Secure Series A funding, transition to a non-profit)",
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
                `<div class="subsection-container conditional-field" data-show-for="For-Profit Business,Hybrid Organization">
                    <label class="main-label">2.4 Financial Health Snapshot (Optional)</label>
                    <p class="description">Provide metrics for a consistent time-frame (e.g., trailing 6 months).</p>
                    ${createInputField("burn-rate", "Monthly Burn Rate (USD)", "", "identity.financials.monthlyBurnRate", "", "number")}
                    ${createInputField("runway", "Cash Runway (Months)", "", "identity.financials.cashRunwayMonths", "", "number")}
                </div>`,
                createMultiChoice("org-size", "2.5 Organization Size (People)", "Based on employees, members, or active participants.", "radio", [
                    {label: "Micro (<10)"}, {label: "Small (10–50)"}, {label: "Medium (51–200)"}, {label: "Large (>200)"}, {label: "Uncertain"}
                ], "identity.size"),
            ]
        },
        {
            title: "Section 3: Core Strategy", id: "section-strategy", path: "strategy", isCritical: true,
            description: "Define your organization's strategic direction. This is the compass that guides your decisions.",
            changesPrompt: "Have there been any recent pivots or refinements to your mission, vision, or core values?",
            goalsPrompt: "What is your primary goal for your strategy itself? (e.g., achieve mission-alignment in all departments)",
            parts: [
                createTextField("mission-statement", "3.1 Mission Statement", "Your 'Why'. What is your organization's core purpose?", 3, "strategy.missionStatement"),
                createTextField("vision-statement", "3.2 Vision Statement", "Your 'Where'. What is the future you aim to create?", 3, "strategy.visionStatement"),
                createTextField("core-values", "3.3 Core Values & a Recent Example", "For one of your core values, describe a specific, recent example of how the team lived (or failed to live) that value.", 4, "strategy.valuesAndBehaviors", "Example: Value: Customer Obsession. Behavior: An engineer stayed up all night to fix a single customer's critical bug."),
                createTextField("north-star-metric", "3.4 North Star Metric", "What is the single most important metric that measures the value you deliver to your customers?", 2, "strategy.northStarMetric", `Example: For Slack, it might be "Daily Active Users."`),
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
        },
        {
            title: "Section 5: Stakeholders & Market", id: "section-market", path: "market", isCritical: true,
            description: "Define who you serve and the environment you operate in.",
            parts: [
                createTextField("icp", "5.1 Ideal Customer Profile", "Describe your primary customer. Who are they and what do they need?", 4, "market.icp"),
                createTextField("buyer-jtbd", "5.2 Economic Buyer's / Sponsor's Job To Be Done", "Describe the needs of the stakeholder who approves the budget or enables the project (e.g., the Purchaser, the Organizer, the Sponsor).", 4, "market.buyerJtbd", `Framework: "When [business situation], I want to [approve a solution], so I can [achieve business outcome]."`),
                createTextField("user-jtbd", "5.3 End User's / Member's Job To Be Done", "Describe the needs of the stakeholder who directly uses the product or participates in the activity (e.g., the Daily User, the Beneficiary, the Member).", 4, "market.userJtbd", `Framework: "When [I am doing my work], I want to [use a tool], so I can [achieve a personal/team benefit]."`),
                createTextField("uvp", "5.4 Unique Value Proposition", "What makes your organization unique and why should customers choose you?", 3, "market.uvp"),
                createMultiChoice("market-dynamics", "5.5 Competitive Landscape: Market Dynamics", "", "radio", [{label: "Dominant Leader"}, {label: "Oligopoly (A few major players)"}, {label: "Fragmented (Many small players)"}, {label: "Emerging (New market)"}], "market.marketDynamics"),
                createSlider("market-confidence", "5.6 Confidence in This Section", "How confident are you in your assessment of the customer and market?", "market.confidenceScore", "Very Uncertain", "Very Confident"),
            ]
        },
        {
            title: "Section 6: Operations & Culture", id: "section-operations", path: "operations", isCritical: true,
            description: "Evaluate your internal workings—what you offer, how you decide, and how you manage risk.",
            changesPrompt: "Any recent operational changes like new tools, team restructuring, or shifts in decision-making?",
            goalsPrompt: "What is your top internal operational priority for the next year? (e.g., reduce product development cycle time by 20%)",
            parts: [
                createMultiChoice("primary-offering", "6.1 Primary Offering", "What is the main product or service you provide?", "radio", [{label: "Digital Product"}, {label: "Service"}, {label: "Hybrid (Product & Service)"}, {label: "Uncertain"}], "operations.primaryOffering"),
                createMultiChoice("decision-style", "6.2 Decision-Making Style", "How are major decisions typically made?", "radio", [{label: "Top-Down"}, {label: "Consensus-Based"}, {label: "Data-Driven"}, {label: "Hybrid"}], "operations.decisionStyle"),
                createSelectField("risk-appetite", "6.3 Risk Appetite", "How would you rate your organization's willingness to take risks?", "operations.riskAppetite", [
                    {value: "", label: "Select a rating..."}, {value: "3", label: "3 - Averse"}, {value: "5", label: "5 - Calculated"}, {value: "7", label: "7 - Seeking"}, {value: "10", label: "10 - Aggressive"}
                ]),
                createTextField('team-capabilities', "6.4 Team Strengths & Gaps", "Strength: What is your team's single greatest strength? \nGap: What is the most critical skill or role gap?", 5, "operations.teamCapabilities"),
            ]
        },
        {
            title: "Section 7: Past Performance & Lessons", id: "section-lessons", path: "lessons",
            description: "Reflect on past events to inform future strategy. Your history contains your most valuable lessons.",
            changesPrompt: "What is the most significant event (positive or negative) from the past year?",
            goalsPrompt: "What is your primary goal related to learning from the past? (e.g., implement a formal post-mortem process)",
            parts: [
                createTextField("past-failure", "7.1 Analyze a Past Failure", "Describe a significant past failure or setback. What was the primary lesson learned?", 4, "lessons.failureAnalysis"),
                createMultiChoice("failure-pattern", "Was this an isolated event or part of a recurring pattern?", "", "radio", [{label: "Isolated Event"}, {label: "Recurring Pattern"}], "lessons.failurePattern"),
                createTextField("past-success", "7.2 Analyze a Past Success", "Describe a significant past success. What was the key factor that made it successful?", 4, "lessons.successAnalysis"),
                createMultiChoice("success-pattern", "Was this an isolated event or part of a recurring pattern?", "", "radio", [{label: "Isolated Event"}, {label: "Recurring Pattern"}], "lessons.successPattern"),
                createTextField("past-attempts", "7.3 What Have You Already Tried to Solve This Problem?", "Briefly list any previous attempts or solutions that were considered or implemented and why they didn't work.", 4, "lessons.pastAttempts")
            ]
        },
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

    const buildQuestionnaireHtml = () => {
        const questionnaireParts = [
            `<h2 id="section-questionnaire">User Input for Strategic Audit</h2>`,
            `<p class="section-explanation">To provide a tailored and actionable strategic audit, please answer the following questions about your role and goals.</p>`,
            `<fieldset>`,
            createTextField("audit-goal", "My Strategic Goal", "Describe your primary goal for this audit.", 4, "userContext.strategicGoal", `Examples:\n(Fundraising): To prepare a pitch deck for our seed round and pressure-test our strategy for investor scrutiny.\n(Decision-Making): To decide whether we should enter the European market or double down on our existing presence in North America.`),
            createMultiChoice("relationship", "1. What is your relationship to the organization?", "", "checkbox", [{ label: "Founder/Owner" }, { label: "Executive/Leadership" }, { label: "Manager" }, { label: "Employee/Team Member" }, { label: "Investor/Board Member" }, { label: "Consultant/Advisor" }], "userContext.relationship"),
            createMultiChoice("analytical-language", "2. What are the top two 'languages' you use to analyze your business?", "Select your primary and secondary focus.", "checkbox", [
                {label: "Financial"}, {label: "Customer-Centric"}, {label: "Operational"}, {label: "Technical"}, {label: "Strategic"}, {label: "Human-Centric"}
            ], "userContext.analyticalLanguage"),
            `</fieldset>`
        ];
        const validationStep = `<div class="journey-step"> <h2>Validate Your Organizational Snapshot with an AI Cognitive Partner</h2> <p>The AI will help improve objectivity, clarity, and strategic focus.</p> <div class="ai-validation-container"><button type="button" id="consult-ai-button">Generate AI Cognitive Partner Prompt</button></div></div>`;
        return questionnaireParts.join('') + validationStep;
    };
    finalContainer.innerHTML = buildQuestionnaireHtml();

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
        let financialOptions = '<option value="">Select the most important...</option>';
        financialCheckboxes.forEach(checkbox => {
            financialOptions += `<option value="${checkbox.value}">${checkbox.value}</option>`;
        });
        financialSelect.innerHTML = financialOptions;

        const customerCheckboxes = form.querySelectorAll('input[name="customer-metrics-checkboxes"]:checked');
        const customerSelect = document.getElementById('important-customer-metric-select');
        if (!customerSelect) return;
        let customerOptions = '<option value="">Select the most important...</option>';
        customerCheckboxes.forEach(checkbox => {
            customerOptions += `<option value="${checkbox.value}">${checkbox.value}</option>`;
        });
        customerSelect.innerHTML = customerOptions;
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
        saveButton.textContent = state ? 'Save Profile to File (.json) *' : 'Save Profile to File (.json)';
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

        form.querySelectorAll('[data-rank-path]').forEach(group => {
            const path = group.dataset.rankPath;
            const ranks = [];
            group.querySelectorAll('input[type="number"]').forEach(input => {
                if (input.value) {
                    ranks.push({ rank: parseInt(input.value, 10), value: input.dataset.rankValue });
                }
            });
            ranks.sort((a, b) => a.rank - b.rank);
            set(data, path, ranks.map(item => item.value));
        });

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
            showNotification('Profile saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            showNotification('Could not save the profile.', 'error');
        }
    };

    const loadProfileFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.metadata || !data.basicInfo) { throw new Error("Invalid or incomplete profile structure."); }
                repopulateForm(data);
                showNotification(`Profile "${data.basicInfo.organizationName}" loaded.`, 'success');
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                showNotification('Invalid or corrupted profile file.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    const consultAiButton = document.querySelector('#consult-ai-button');
    const aiPromptModal = document.getElementById('ai-prompt-modal');
    const aiPromptOutput = document.getElementById('ai-prompt-output');
    const selectPromptButton = document.getElementById('select-prompt-button');
    const closeModalButtons = document.querySelectorAll('#close-modal-button-top, #close-modal-button-bottom');
    
    const generateAIPrompt = () => {
        const allData = gatherFormData();
        const orgName = allData.basicInfo?.organizationName || 'the Organization';
        const orgData = { ...allData };
        delete orgData.userContext;
        const userContext = allData.userContext || {};
        const relationship = userContext.relationship ? userContext.relationship.join(', ') : '';
        const analyticalLanguage = userContext.analyticalLanguage ? userContext.analyticalLanguage.join(', ') : '';
        
        const promptTemplate = `
[1.0 PERSONA & PRIME DIRECTIVE]
You are an AI Organizational Strategist, functioning as a fractional Chief Strategy Officer. Your analysis must adapt to the organization’s sector and type, ensuring relevance to its unique context. Your prime directive is to create a shared understanding of the organization's current situation. You must be constraints-solution agnostic in your initial analysis. Your goal is to diagnose the inputs, identify gaps and misalignments, and provide feedback to improve the snapshot *before* offering strategic solutions. **You must prioritize the user's stated \`[1.5 STRATEGIC OBJECTIVE]\` as the primary lens through which all other data is interpreted.** A recommendation that is misaligned with this input is an invalid response.

[1.1 BIAS & BLIND SPOT ANALYSIS]
Your analysis of blind spots must be actionable. For each unselected 'analytical language' (e.g., 'Operational'), generate the 3-5 most pointed questions a skeptical investor who specializes in that domain would ask during a pitch.

[1.5 STRATEGIC OBJECTIVE / THE 'WHY']
My Goal: "${userContext.strategicGoal || "Not specified. Assume the goal is to identify the highest-impact strategic priorities for the next 12-18 months."}"

[2.0 DATA STREAM & CONTEXT]
[2.1 ORGANIZATIONAL PROFILE JSON]
<details><summary>View Organizational Profile JSON</summary>
\`\`\`json
${JSON.stringify(orgData, null, 2)}
\`\`\`
</details>

[2.5 USER CONTEXT PROFILE (FROM QUESTIONNAIRE)]
My Relationship to the Organization: "${relationship || 'Not specified.'}"
My Top Two Analytical 'Languages': "${analyticalLanguage || "Not specified."}"

[3.0 CORE DIRECTIVES: ANALYSIS & MODELING]
3.1: **Situational Synthesis:** Synthesize all data to form a holistic understanding of the organization.
3.2: **Inconsistency & Gap Detection:** Actively search for contradictions between sections (e.g., Archetype vs. KPIs, Funding Model vs. Goals, Stated Values vs. Past Failures).
3.3: **Recommendation Formulation:** Formulate specific, constructive suggestions for each section of the input to improve its clarity and depth.
3.4: **Red Teaming:** Dedicate a section to a 'Pre-Mortem' analysis. Assume the company fails 18 months from now. Based on the snapshot, identify the top 3 most likely reasons for this failure.
3.5: **Alignment Score:** At the beginning of the diagnostic, provide a 1-10 'Strategic Alignment Score' that rates the overall consistency between the company's archetype, goals, capabilities, and market assessment, and briefly justify the score.

[4.0 OUTPUT PROTOCOL]
Generate a report with the following structure precisely. Use markdown for formatting.

# Strategic Snapshot Diagnostic & Analysis for ${orgName}

## Strategic Alignment Score
(Provide a score from 1-10 and a one-sentence justification as per directive 3.5)

---

## Part 1: Executive Summary
(Provide a concise, high-level summary of the organization's current situation. Highlight the most critical challenge or tension you've identified.)

---

## Part 2: Situational Analysis
### 2.1 Core Identity & Strategic Intent
(Summarize the organization's archetype, mission, and core strategy.)

### 2.2 Key Strengths & Tailwinds
(Based on the input, what are the most significant strengths and positive momentum points?)

### 2.3 Critical Vulnerabilities & Headwinds
(Based on the input, what are the most significant gaps, risks, or negative patterns?)

---

## Part 3: Diagnostic Deep Dive
### 3.1 Inconsistency & Misalignment Report
(List the top 3-5 most significant inconsistencies or misalignments you detected.)

### 3.2 Bias and Blind Spot Assessment (Skeptical Investor Questions)
(Present this as a list of pointed questions for each unselected analytical language, as per directive 1.1.)

### 3.3 Red Team Analysis (Pre-Mortem)
(Based on directive 3.4, list the top 3 likely reasons for failure and recommend the single most important action to mitigate the #1 risk.)

---

## Part 4: Recommendations for Improving Your Snapshot
(Provide section-by-section feedback. For each suggestion, use the following format exactly, including the question number.)

**Section 3.3: Core Values & a Recent Example**
* **Current Input:** (Summarize the user's input for this question)
* **Analysis & Suggestions:** "This is a strong, evidence-based value. To improve, consider if this behavior is consistently rewarded or if it was an isolated act of heroism. A healthy culture makes excellence a repeatable process, not just a single event."

**Section 6.4: Team Strengths & Gaps**
* **Current Input:** (Summarize the user's input for this question)
* **Analysis & Suggestions:** "The link between the skill gap and its business impact is clear. To make this even more compelling for an investor, try to quantify the impact. For example: 'Failing to generate qualified leads stalls growth by an estimated two quarters and puts our next fundraising milestone at risk.'"

---

## Part 5: The 3 Critical Priorities & Path Forward
(Synthesize all findings into the 3 most critical actions or strategic questions that, if addressed in the next 30 days, would create the most value and mitigate the most risk. Conclude with a summary that sets the stage for the next phase of planning.)

---

**Next Step: Save This Report**
This diagnostic report is a critical asset. Save it to your device using a clear naming convention (e.g., \`org_convoking4_AI-Diagnostic_2025-08-20.md\`). It serves as the official 'shared understanding' and will be used as the foundational briefing document for any subsequent Undertaking assessments.
`;
        return promptTemplate.trim();
    };
    
    if (consultAiButton) {
        consultAiButton.addEventListener('click', () => { aiPromptOutput.value = generateAIPrompt(); aiPromptModal.showModal(); });
    }
    if (closeModalButtons) {
        closeModalButtons.forEach(button => button.addEventListener('click', () => aiPromptModal.close()));
    }
    if (selectPromptButton) {
        selectPromptButton.addEventListener('click', () => {
            aiPromptOutput.select();
            aiPromptOutput.setSelectionRange(0, aiPromptOutput.value.length);
            try {
                navigator.clipboard.writeText(aiPromptOutput.value);
                showNotification('Prompt copied to clipboard!', 'success');
            } catch (err) {
                console.error('Clipboard API failed:', err);
                showNotification('Could not copy text.', 'error');
            }
        });
    }
    
    function updateScrollMargin() {
        if (!topBar) return;
        const headerHeight = topBar.getBoundingClientRect().height;
        const marginValue = Math.ceil(headerHeight) + 20;

        if (!scrollMarginStyleElement) {
            scrollMarginStyleElement = document.createElement('style');
            document.head.appendChild(scrollMarginStyleElement);
        }
        scrollMarginStyleElement.textContent = `h2[id] { scroll-margin-top: ${marginValue}px; }`;
    }
    
    function debounce(func, delay = 100) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // --- Initial Setup and Event Listeners ---
    if(document.getElementById('version-display')) {
        document.getElementById('version-display').textContent = `Version ${APP_VERSION}`;
    }
    if(document.getElementById('current-date')) {
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (saveButton) saveButton.addEventListener('click', saveProfileToFile);
    if (clearButton) clearButton.addEventListener('click', clearForm);
    if(document.getElementById('progress-file-loader')) {
        document.getElementById('progress-file-loader').addEventListener('change', loadProfileFromFile);
    }
    
    form.addEventListener('submit', (event) => event.preventDefault());
    form.addEventListener('input', () => {
        if (isRepopulating) return;
        setDirty(true);
        debounce(saveStateToLocalStorage, 500)();
    });
    
    form.addEventListener('change', (e) => {
        if (e.target.name === 'org-archetype') {
            handleArchetypeChange();
        }
        if (e.target.name === 'analytical-language') {
            const checkboxes = form.querySelectorAll('input[name="analytical-language"]:checked');
            if (checkboxes.length > 2) {
                e.target.checked = false;
                showNotification("Please select a maximum of two languages.", "error");
            }
        }
        if (e.target.name === 'financial-metrics-checkboxes' || e.target.name === 'customer-metrics-checkboxes') {
            updateKpiDropdowns();
        }
    });

    // --- Final Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        loadStateFromLocalStorage();
        updateScrollMargin();
        updateKpiDropdowns();
        handleArchetypeChange();
    });
    window.addEventListener('resize', debounce(updateScrollMargin));

})();
