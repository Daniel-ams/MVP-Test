      // Convoking4 Organizational Snapshot Assessment
// Version: 8.1 (Hybrid)
// Date: August 20, 2025

(function() {
    const APP_VERSION = '8.1 (Hybrid)';
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

    const createMultiChoice = (id, title, description, type, options, path, isSubsection = false) => {
        let optionsHTML = options.map(opt => {
            const uniqueId = `${id}-${opt.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const optDescription = opt.description ? `<p class="option-description">${opt.description}</p>` : '';
            const optExample = opt.example ? `<p class="option-example">${opt.example}</p>` : '';
            const showFor = opt.showFor ? `data-show-for="${opt.showFor.join(',')}"` : '';
            const containerClass = opt.showFor ? 'conditional-field' : '';

            return `<div class="input-group-container ${containerClass}" ${showFor}>
                        <div class="input-group">
                            <input type="${type}" id="${uniqueId}" name="${id}" value="${opt.label}" data-path="${path}">
                            <label for="${uniqueId}">${opt.label}</label>
                        </div>
                        ${optDescription}
                        ${optExample}
                    </div>`;
        }).join('');

        const labelClass = isSubsection ? 'subsection-title' : 'main-label';
        const labelElement = title ? `<label class="${labelClass}">${title}</label>` : '';

        return `<div class="form-group">
                    ${labelElement}
                    ${description && !isSubsection ? `<p class="description">${description}</p>` : ''}
                    <div class="${type}-group">${optionsHTML}</div>
                </div>`;
    };

    // --- VERSION 8.1 (HYBRID) FORM BLUEPRINT ---
    const sections = [
        {
            title: "Section 1: Basic Information & Archetype", id: "section-basic-info", path: "basicInfo",
            description: "Start with the basics. This helps identify the organization and its fundamental purpose.",
            parts: [
                createInputField("org-name", "1.1 Organization Name", "", "basicInfo.organizationName", "Example: HealthyCare Clinic", "text", {required: true}),
                createInputField("org-year", "1.2 Year Founded", "", "basicInfo.yearFounded", "Example: 2015", "number", {min: "1800", max: new Date().getFullYear()}),
                createInputField("org-city", "1.3 Primary City", "", "basicInfo.city", "Example: Raleigh"),
                createInputField("org-country", "1.4 Primary Country", "", "basicInfo.country", "Example: United States"),
                createMultiChoice("org-archetype", "1.5 Primary Organizational Archetype", "What is the fundamental purpose of your organization? Select one.", "radio", [
                    {label: "For-Profit Business", description: "Primary focus is generating profit for owners or shareholders."},
                    {label: "Mission-Driven Organization", description: "Primary focus is a social or public good, with profit being secondary (e.g., non-profit, NGO)."},
                    {label: "Member/Community-Based Organization", description: "Primary focus is serving a specific group of members (e.g., club, association, HOA)."},
                    {label: "Investor/Financial Firm", description: "Primary focus is investing capital to generate financial returns."},
                    {label: "Hybrid Organization", description: "Blends profit-generation with a core social or community mission (e.g., B-Corp)."},
                    {label: "Uncertain", description: "The organization's purpose is not clearly defined."}
                ], "basicInfo.archetype"),
            ]
        },
        {
            title: "Section 2: Identity & Structure", id: "section-identity", path: "identity",
            description: "Define the core operational and legal structure of your organization.",
            parts: [
                 createMultiChoice("funding-model", "2.1 Primary Funding Model", "How does your organization primarily finance its operations?", "radio", [
                    {label: "Revenue from Services/Products", showFor: ["For-Profit Business", "Hybrid Organization"]},
                    {label: "Donations/Grants", showFor: ["Mission-Driven Organization", "Hybrid Organization"]},
                    {label: "Membership Fees", showFor: ["Member/Community-Based Organization"]},
                    {label: "Assessments (e.g., HOA dues)", showFor: ["Member/Community-Based Organization"]},
                    {label: "Investment Returns", showFor: ["Investor/Financial Firm"]},
                    {label: "Bootstrapping", showFor: ["For-Profit Business"]},
                    {label: "Institutional Support", showFor: ["Mission-Driven Organization", "Member/Community-Based Organization"]},
                    {label: "Mixed Funding", showFor: ["For-Profit Business", "Hybrid Organization", "Mission-Driven Organization"]},
                    {label: "Uncertain"}
                ], "identity.fundingModel"),
                createMultiChoice("legal-structure", "2.2 Legal Structure", "What is your organization's legal form?", "radio", [
                    {label: "LLC", showFor: ["For-Profit Business", "Hybrid Organization"]},
                    {label: "Corporation (C-Corp/S-Corp)", showFor: ["For-Profit Business", "Hybrid Organization", "Investor/Financial Firm"]},
                    {label: "Nonprofit/NGO", showFor: ["Mission-Driven Organization"]},
                    {label: "Sole Proprietorship", showFor: ["For-Profit Business"]},
                    {label: "Partnership", showFor: ["For-Profit Business", "Investor/Financial Firm"]},
                    {label: "B-Corp/Hybrid", showFor: ["Hybrid Organization"]},
                    {label: "Cooperative", showFor: ["Member/Community-Based Organization", "Hybrid Organization"]},
                    {label: "Pre-Formal/Informal"},
                    {label: "Uncertain"}
                ], "identity.legalStructure"),
                `<div class="subsection-container conditional-field" data-show-for="For-Profit Business,Hybrid Organization,Investor/Financial Firm">
                    <label class="main-label">2.3 Financial Health Snapshot (Optional)</label>
                    <p class="description">Please provide metrics for a consistent time-frame (e.g., trailing 6 months).</p>
                    ${createInputField("burn-rate", "Monthly Burn Rate (USD)", "", "identity.financials.monthlyBurnRate", "", "number", {placeholder: "e.g., 50000"})}
                    ${createInputField("runway", "Cash Runway (Months)", "", "identity.financials.cashRunwayMonths", "", "number", {placeholder: "e.g., 18"})}
                    ${createInputField("ltv-cac", "LTV:CAC Ratio", "", "identity.financials.ltvCacRatio", "", "text", {placeholder: "e.g., 3:1"})}
                </div>`,
                createMultiChoice("org-size", "2.4 Organization Size (People)", "Based on employees, members, or active participants.", "radio", [
                    {label: "Micro (<10)"}, {label: "Small (10–50)"}, {label: "Medium (51–200)"}, {label: "Large (>200)"}, {label: "Uncertain"}
                ], "identity.size"),
            ]
        },
        {
            title: "Section 3: Key Performance Indicators (KPIs)", id: "section-kpis", path: "kpis",
            description: "Strategy without data is speculation. Provide core metrics to create a quantitative baseline.",
            parts: [
                createMultiChoice("financial-metrics", "3.1 Financial Metrics", "Select all relevant financial indicators.", "checkbox", [
                    {label: "Annual Recurring Revenue (ARR)"}, {label: "Monthly Burn Rate"}, {label: "Cash Runway (Months)"}, {label: "LTV:CAC Ratio"}, {label: "Gross Margin"}
                ], "kpis.financialMetrics"),
                createInputField("important-financial-metric", "Of those, which is the SINGLE most important financial metric right now?", "", "kpis.mostImportantFinancial"),
                createMultiChoice("customer-metrics", "3.2 Customer Metrics", "Select all relevant customer health indicators.", "checkbox", [
                    {label: "Active Users/Customers"}, {label: "Churn Rate (%)"}, {label: "Net Promoter Score (NPS)"}, {label: "Customer Satisfaction (CSAT)"}, {label: "Customer Retention Rate"}
                ], "kpis.customerMetrics"),
                createInputField("important-customer-metric", "Of those, which is the SINGLE most important customer metric right now?", "", "kpis.mostImportantCustomer"),
            ]
        },
        {
            title: "Section 4: Stakeholders & Market", id: "section-stakeholders-market", path: "stakeholdersMarket",
            description: "Define who you serve and the environment you operate in.",
            parts: [
                createTextField("buyer-jtbd", "4.1 Economic Buyer's / Sponsor's Job To Be Done", "Describe the needs of the stakeholder who approves the budget or enables the project (e.g., the Purchaser, the Organizer, the Sponsor).", 4, "stakeholdersMarket.buyerJtbd", `Framework: "When [business situation], I want to [approve a solution], so I can [achieve business outcome]."`),
                createTextField("user-jtbd", "4.2 End User's / Member's Job To Be Done", "Describe the needs of the stakeholder who directly uses the product or participates in the activity (e.g., the Daily User, the Beneficiary, the Member).", 4, "stakeholdersMarket.userJtbd", `Framework: "When [I am doing my work], I want to [use a tool], so I can [achieve a personal/team benefit]."`),
                createTextField("competitors", "4.3 Key Competitors / Alternatives", "List your top 1-3 competitors or alternatives. Why might someone choose them over you?", 4, "stakeholdersMarket.competitors", `Example: BigBank (Reason: Customers trust their established brand).`),
            ]
        },
        {
            title: "Section 5: Strategic Momentum", id: "section-momentum", path: "strategicMomentum",
            description: "This captures your organization's dynamics—what's working and what isn't.",
            parts: [
                createTextField("tailwind", "5.1 What is the #1 thing that is working well and you should do more of? (Your biggest tailwind)", "", 3, "strategicMomentum.tailwind"),
                createTextField("headwind", "5.2 What is the #1 thing that is not working and you should stop doing? (Your biggest headwind)", "", 3, "strategicMomentum.headwind")
            ]
        },
    ];

    // --- DYNAMICALLY BUILD THE FORM AND NAV ---
    const formHtml = [];
    const navHtml = [];
    sections.forEach(section => {
        formHtml.push(`<h2 id="${section.id}">${section.title}</h2>`);
        if (section.description) { formHtml.push(`<p class="section-explanation">${section.description}</p>`); }
        formHtml.push(`<fieldset>`);
        formHtml.push(section.parts.join(''));
        formHtml.push(`</fieldset>`);
        navHtml.push(`<li><a href="#${section.id}">${section.title.split(':')[1].trim()}</a></li>`);
    });
    
    formContainer.innerHTML = formHtml.join('');
    navLinksContainer.innerHTML = navHtml.join('');

    // --- USER CONTEXT AND AI PROMPT TRIGGER ---
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
            if (selectedArchetype && showFor.includes(selectedArchetype)) {
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
    
    // ... (All other helper functions: clearForm, setDirty, showNotification, set, getValueFromPath, gatherFormData, repopulateForm, etc. remain here without changes) ...
    // NOTE: For brevity, the unchanged helper functions are omitted here, but they are required for the app to work.
    // Please use the full script from the previous versions for these functions.
    // The following is the updated AI prompt generation function.

    // --- AI PROMPT MODAL LOGIC (VERSION 8.1) ---
    const consultAiButton = document.querySelector('#consult-ai-button');
    const aiPromptModal = document.getElementById('ai-prompt-modal');
    // ... (rest of modal constants)

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
You are an AI Organizational Strategist... (The full advanced prompt from version 7.3/8.0 goes here, adapted for the new data paths of v8.1).

// The following is a placeholder to show where the prompt would go.
// For the final implementation, the full detailed prompt is required.
# Strategic Snapshot Diagnostic & Analysis for ${orgName}

Based on the goal to "${userContext.strategicGoal}", here is an analysis of the provided snapshot...
`;
        return promptTemplate;
    };
    
    // --- EVENT LISTENERS & INITIALIZATION ---
    // ... (All event listeners remain here)
    form.addEventListener('change', (e) => {
        if (e.target.name === 'org-archetype') {
            handleArchetypeChange();
        }
        // ... (rest of the change event listener)
    });
    // ... (rest of initialization code)
})();
