// Convoking4 Snapshot Assessment
// Version: 9.1 (Phase 2 - Comprehensive)
// Date: August 20, 2025

(function() {
    // --- GLOBAL STATE ---
    let activeOrganization = null;
    let currentAssessmentType = null;

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
    
    const aiPromptModal = document.getElementById('ai-prompt-modal');
    const aiPromptOutput = document.getElementById('ai-prompt-output');
    const selectPromptButton = document.getElementById('select-prompt-button');
    const closeModalButtons = document.querySelectorAll('#close-modal-button-top, #close-modal-button-bottom');

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

    // --- ASSESSMENT BLUEPRINTS ---

    const organizationalSections = [
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
        {
            title: "Section 8: Source Document & Context", id: "section-source-document", path: "sourceDocument",
            description: "To enhance the AI's analysis, paste the content of a relevant source document below (e.g., business plan, meeting notes, market analysis). The AI will use this to validate and enrich the snapshot.",
            parts: [
                createTextField("source-document-paste", "Paste Source Document Content Here", "", 20, "sourceDocument.content")
            ]
        }
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
            formHtml.push(`<fieldset>`);
            formHtml.push(section.parts.join(''));
            if (section.changesPrompt) {
                 formHtml.push(createTextField(`${section.id}-changes`, section.changesPrompt, "", 2, `${section.path}.recentChanges`));
            }
             if (section.goalsPrompt) {
                 formHtml.push(createTextField(`${section.id}-goals`, section.goalsPrompt, "", 2, `${section.path}.futureGoals`));
            }
            formHtml.push(`</fieldset>`);
            navHtml.push(`<li><a href="#${section.id}">${navTitle}</a></li>`);
        });
        
        formContainer.innerHTML = formHtml.join('') + buildQuestionnaireHtml();
        navLinksContainer.innerHTML = navHtml.join('');
        
        updateKpiDropdowns();
        handleArchetypeChange();
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
                
                renderForm(undertakingSections);
                showNotification(`Loaded context from "${activeOrganization.basicInfo.organizationName}". You can now begin the Undertaking Snapshot.`, 'success');

            } catch (error) {
                console.error('Error parsing organization file:', error);
                showNotification(error.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

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
        const validationStep = `<div class="journey-step"> <h2>Validate Your Snapshot with an AI Cognitive Partner</h2> <p>The AI will help improve objectivity, clarity, and strategic focus.</p> <div class="ai-validation-container"><button type="button" id="consult-ai-button">Generate AI Cognitive Partner Prompt</button></div></div>`;
        return questionnaireParts.join('') + validationStep;
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
        const allData = gatherFormData();
        let promptTemplate = `Analyze the following snapshot data:\n\n${JSON.stringify(allData, null, 2)}`;

        if (currentAssessmentType === 'organization') {
            promptTemplate = "The full, comprehensive AI prompt for organizations goes here."; // Placeholder
        } else if (currentAssessmentType === 'undertaking' && activeOrganization) {
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
</details>

[2.2 UNDERTAKING PROFILE JSON]
<details><summary>View Undertaking Data</summary>
\`\`\`json
${JSON.stringify(allData, null, 2)}
\`\`\`
</details>

[4.0 OUTPUT PROTOCOL]
Generate a report focusing on:
1.  **Strategic Alignment Score (1-10):** How well does this undertaking align with the parent organization's stated mission?
2.  **Key Misalignments:** Identify 2-3 areas where the undertaking's goals or resource needs may conflict with the parent organization's reality.
3.  **Critical Questions:** List 3 pointed questions the project sponsor should be prepared to answer before seeking final approval.
`;
        }
        
        aiPromptOutput.value = promptTemplate.trim();
        aiPromptModal.showModal();
    };

    const gatherFormData = () => {
        const data = { metadata: { type: currentAssessmentType, version: '9.1' } };
        form.querySelectorAll('[data-path]').forEach(el => {
            const path = el.dataset.path;
            if (el.type === 'radio' && el.checked) {
                set(data, path, el.value);
            } else if (el.type === 'checkbox') {
                let currentVal = getValueFromPath(data, path) || [];
                if (el.checked && !currentVal.includes(el.value)) {
                    currentVal.push(el.value);
                } else if (!el.checked && currentVal.includes(el.value)) {
                    currentVal = currentVal.filter(v => v !== el.value);
                }
                set(data, path, currentVal);
            } else if (el.tagName.toLowerCase() === 'select' && el.value) {
                set(data, path, el.value);
            } else if (el.type !== 'radio' && el.type !== 'checkbox' && el.tagName.toLowerCase() !== 'select' && el.value) {
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

    const showNotification = (message, type = 'success') => {
        const banner = document.getElementById('notification-banner');
        banner.textContent = message;
        banner.className = `is-visible is-${type}`;
        setTimeout(() => { banner.className = ''; }, 3000);
    };

    // --- EVENT LISTENERS ---
    saveButton.addEventListener('click', saveProfileToFile);
    form.addEventListener('click', (e) => {
        if (e.target.id === 'consult-ai-button') {
            generateAIPrompt();
        }
    });
    
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
                showNotification('Could not copy text.', 'error');
            }
        });
    }

    form.addEventListener('change', (e) => {
        if (e.target.name === 'org-archetype') {
            handleArchetypeChange();
        }
        if (e.target.name === 'financial-metrics-checkboxes' || e.target.name === 'customer-metrics-checkboxes') {
            updateKpiDropdowns();
        }
    });
    
    // --- INITIALIZATION ---
    initializeApp();

})();
