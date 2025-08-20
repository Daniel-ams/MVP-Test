// Convoking4 Organizational Snapshot Assessment
// Version: 8.0
// Date: August 20, 2025

(function() {
    const APP_VERSION = '8.0';
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

    const createMultiChoice = (id, title, description, type, options, path) => {
        let optionsHTML = options.map(opt => {
            const uniqueId = `${id}-${opt.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            return `<div class="input-group-container">
                        <div class="input-group">
                            <input type="${type}" id="${uniqueId}" name="${id}" value="${opt.label}" data-path="${path}">
                            <label for="${uniqueId}">${opt.label}</label>
                        </div>
                    </div>`;
        }).join('');

        return `<div class="form-group">
                    <label class="main-label">${title}</label>
                    ${description ? `<p class="description">${description}</p>` : ''}
                    <div class="${type}-group">${optionsHTML}</div>
                </div>`;
    };

    // --- VERSION 8.0 FORM BLUEPRINT ---
    const sections = [
        {
            title: "Section 1: Basic Information", id: "section-basic-info", path: "basicInfo",
            parts: [
                createInputField("org-name", "1.1 Organization Name", "", "basicInfo.organizationName", "", "text", {required: true}),
                createInputField("org-year", "1.2 Year Founded", "", "basicInfo.yearFounded", "", "number", {min: "1800", max: new Date().getFullYear()}),
            ]
        },
        {
            title: "Section 2: Key Performance Indicators (KPIs)", id: "section-kpis", path: "kpis",
            description: "Strategy without data is speculation. Provide a few core metrics to create a quantitative baseline for the entire analysis.",
            parts: [
                createTextField("financial-metrics", "Financial Metrics", "List 2-3 of your most important financial health indicators.", 4, "kpis.financialMetrics", "Example: e.g., Annual Recurring Revenue (ARR), Burn Rate, Cash Runway, LTV:CAC Ratio."),
                createTextField("customer-metrics", "Customer Metrics", "List 2-3 of your most important customer health indicators.", 4, "kpis.customerMetrics", "Example: e.g., Active Users/Customers, Churn Rate, Net Promoter Score (NPS).")
            ]
        },
        {
            title: "Section 3: Mission & Vision", id: "section-mission-vision", path: "missionVision",
            parts: [
                createTextField("mission-statement", "3.1 Mission Statement", "Your 'Why'. What is your organization's core purpose?", 3, "missionVision.missionStatement"),
                createTextField("values-behaviors", "3.2 Core Values & Associated Behaviors", "For each of your core values, describe a specific, recent example of how the organization lived (or failed to live) that value.", 5, "missionVision.valuesAndBehaviors", "Example: Value: 'Customer Obsession'. Behavior: An engineer stayed up all night to fix a single customer's critical bug before a major deadline.")
            ]
        },
        {
            title: "Section 4: Customer & Market", id: "section-customer-market", path: "customerMarket",
            parts: [
                createTextField("customer-jtbd", "4.1 Customer's Job To Be Done (JTBD)", 'Use the framework: "When [situation], I want to [motivation], so I can [expected outcome]."', 4, "customerMarket.jobToBeDone", `Example: "When I'm planning our family reunion (situation), I want to easily collect and track payments (motivation), so I can avoid chasing people for money and focus on the fun parts (outcome)."`),
                createTextField("team-capabilities", "4.2 Team Capabilities: Evidence & Impact", "Strength: What is your team's single greatest strength? Provide one piece of evidence. \nGap: What is the most critical skill/role gap? Describe the direct business impact of this gap.", 5, "customerMarket.teamCapabilities", `Example: Strength: Rapid Prototyping. Evidence: We went from idea to live MVP in 3 weeks. Gap: Senior marketing leadership. Impact: Our product is great but we're failing to generate qualified leads, stalling growth.`)
            ]
        },
        {
            title: "Section 5: Strategic Momentum", id: "section-momentum", path: "strategicMomentum",
            description: "This captures your organization's dynamics—what's working and what isn't. It's often a more honest indicator of health than a static SWOT analysis.",
            parts: [
                createTextField("tailwind", "What is the #1 thing that is working well and you should do more of? (Your biggest tailwind)", "", 3, "strategicMomentum.tailwind"),
                createTextField("headwind", "What is the #1 thing that is not working and you should stop doing? (Your biggest headwind)", "", 3, "strategicMomentum.headwind")
            ]
        },
        {
            title: "Section 6: Past Performance & Lessons", id: "section-past-performance", path: "pastPerformance",
            description: "Reflect on past events to inform future strategy. Your history contains your most valuable lessons.",
            parts: [
                createTextField("past-failure", "6.1 Analyze a Past Failure", "Describe a significant past failure or setback. What was the primary lesson learned?", 4, "pastPerformance.failureAnalysis", "Example: Our first telehealth app launch failed due to poor user onboarding. Lesson: Involve real users in testing from day one."),
                createMultiChoice("failure-pattern", "Was this an isolated event or part of a recurring pattern?", "", "radio", [{label: "Isolated Event"}, {label: "Recurring Pattern"}], "pastPerformance.failurePattern"),
                createTextField("past-success", "6.2 Analyze a Past Success", "Describe a significant past success. What was the key factor that made it successful?", 4, "pastPerformance.successAnalysis", "Example: Partnering with local businesses boosted our user adoption by 300%. Factor: Strategic alliances provided credibility and access to new customers."),
                createMultiChoice("success-pattern", "Was this an isolated event or part of a recurring pattern?", "", "radio", [{label: "Isolated Event"}, {label: "Recurring Pattern"}], "pastPerformance.successPattern"),
            ]
        },
        {
            title: "Section 7: Competitive Landscape", id: "section-competition", path: "competitiveLandscape",
            description: "Evaluate the external and internal forces that impact your organization. No strategy exists in a vacuum.",
            parts: [
                createMultiChoice("market-dynamics", "Market Dynamics", "", "radio", [{label: "Dominant Leader"}, {label: "Oligopoly (A few major players)"}, {label: "Fragmented (Many small players)"}, {label: "Emerging (New market)"}], "competitiveLandscape.marketDynamics"),
                createTextField("competitors", "Key Competitors / Peers", "List your top 1-3 competitors or peer groups. Why might someone choose them over you?", 4, "competitiveLandscape.competitors", `Example: BigBank (Reason: Customers trust their established brand). For internal divisions: 'The data science division often gets more budget because their ROI is easier to prove.'`)
            ]
        },
        {
            title: "Section 8: Final Context", id: "section-final-context", path: "finalContext",
            parts: [
                createTextField("final-context", "Is there any other critical context or nuance an outside advisor must know to understand your situation?", "Use this field to explain any 'Uncertain' selections or provide additional details.", 6, "finalContext.additionalContext")
            ]
        }
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
            createTextField("audit-goal", "My Strategic Goal", "Describe your primary goal for this audit. Be as specific as possible.", 4, "userContext.strategicGoal", `Examples:\n(Fundraising): To prepare a pitch deck for our seed round and pressure-test our strategy for investor scrutiny.\n(Decision-Making): To decide whether we should enter the European market or double down on our existing presence in North America.`),
            createMultiChoice("relationship", "1. What is your relationship to the organization?", "", "checkbox", [{ label: "Founder/Owner" }, { label: "Executive/Leadership" }, { label: "Manager" }, { label: "Employee/Team Member" }, { label: "Investor/Board Member" }, { label: "Consultant/Advisor" }], "userContext.relationship"),
            createMultiChoice("analytical-language", "2. What are the top two 'languages' you use to analyze your business?", "Select your primary and secondary focus.", "checkbox", [
                {label: "Financial", description: "I focus on ROI, burn rate, and profitability."}, 
                {label: "Customer-Centric", description: "I focus on user experience, retention, and satisfaction."}, 
                {label: "Operational", description: "I focus on efficiency, process, and scalability."}, 
                {label: "Technical", description: "I focus on product architecture, reliability, and innovation."}, 
                {label: "Strategic", description: "I focus on market position, competitive advantage, and long-term growth."}, 
                {label: "Human-Centric", description: "I focus on team culture, talent, and stakeholder alignment."}
            ], "userContext.analyticalLanguage"),
            `</fieldset>`
        ];
        const validationStep = `<div class="journey-step"> <h2>Validate Your Organizational Snapshot with an AI Cognitive Partner</h2> <p>The AI will help improve objectivity, clarity, and strategic focus.</p> <div class="ai-validation-container"><button type="button" id="consult-ai-button">Generate AI Cognitive Partner Prompt</button></div></div>`;
        return questionnaireParts.join('') + validationStep;
    };
    finalContainer.innerHTML = buildQuestionnaireHtml();

    // --- CORE APP LOGIC (SAVE, LOAD, ETC.) ---
    const clearForm = () => {
        if (confirm("Are you sure you want to clear all fields? This action cannot be undone.")) {
            localStorage.removeItem('convoking4_autosave_v8');
            form.reset();
            updateGoalsSummary();
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
                    if (Array.isArray(value) && value.includes(el.value)) el.checked = true;
                } else {
                    el.value = value || '';
                }
            });
        });

        isRepopulating = false;
        setDirty(false);
    };

    const saveStateToLocalStorage = () => { if (isDirty) localStorage.setItem('convoking4_autosave_v8', JSON.stringify(gatherFormData())); };

    const loadStateFromLocalStorage = () => {
        const savedData = localStorage.getItem('convoking4_autosave_v8');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                repopulateForm(data);
                showNotification('Unsaved progress from a previous session has been restored.', 'info');
            } catch (e) {
                console.error("Could not parse autosaved data.", e);
                localStorage.removeItem('convoking4_autosave_v8');
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

    // --- AI PROMPT MODAL LOGIC (VERSION 8.0) ---
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
[2.1 ORGANIZATIONAL PROFILE JSON V8.0]
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
3.2: **Inconsistency & Gap Detection:** Actively search for contradictions between sections (e.g., Stated Values vs. described Behaviors, Mission vs. KPIs, Team Gaps vs. stated Tailwinds).
3.3: **Recommendation Formulation:** Formulate specific, constructive suggestions for each section of the input to improve its clarity and depth.
3.4: **Red Teaming:** Dedicate a section to a 'Pre-Mortem' analysis. Assume the company fails 18 months from now. Based on the snapshot, identify the top 3 most likely reasons for this failure.
3.5: **Alignment Score:** At the beginning of the diagnostic, provide a 1-10 'Strategic Alignment Score' that rates the overall consistency between the company's mission, KPIs, capabilities, and market assessment, and briefly justify the score.

[4.0 OUTPUT PROTOCOL]
Generate a report with the following structure precisely. Use markdown for formatting.

# Strategic Snapshot Diagnostic & Analysis for ${orgName}

## Strategic Alignment Score
(Provide a score from 1-10 and a one-sentence justification as per directive 3.5)

---

## Part 1: Executive Summary
(Provide a concise, high-level summary of the organization's current situation. Highlight the most critical challenge or tension you've identified, likely related to their biggest 'Headwind'.)

---

## Part 2: Situational Analysis
### 2.1 Core Identity & Strategic Intent
(Summarize the organization's mission, vision, and core strategy.)

### 2.2 Key Strengths & Tailwinds
(Based on the input, what are the most significant strengths and positive momentum points? Reference their stated 'Tailwind'.)

### 2.3 Critical Vulnerabilities & Headwinds
(Based on the input, what are the most significant gaps, risks, or negative patterns? Reference their stated 'Headwind' and 'Past Failures.')

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

**Section 3.2: Core Values & Associated Behaviors**
* **Current Input:** (Summarize the user's input for this question)
* **Analysis & Suggestions:** "This is a strong, evidence-based value. To improve, consider if this behavior is consistently rewarded or if it was an isolated act of heroism. A healthy culture makes excellence a repeatable process, not just a single event."

**Section 4.2: Team Capabilities: Evidence & Impact**
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
    closeModalButtons.forEach(button => button.addEventListener('click', () => aiPromptModal.close()));
    
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
    document.getElementById('version-display').textContent = `Version ${APP_VERSION}`;
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (saveButton) saveButton.addEventListener('click', saveProfileToFile);
    if (clearButton) clearButton.addEventListener('click', clearForm);
    document.getElementById('progress-file-loader').addEventListener('change', loadProfileFromFile);
    
    form.addEventListener('submit', (event) => event.preventDefault());
    form.addEventListener('input', () => {
        if (isRepopulating) return;
        setDirty(true);
        debounce(saveStateToLocalStorage, 500)();
    });
    
    form.addEventListener('change', (e) => {
        if (e.target.name === 'analytical-language') {
            const checkboxes = form.querySelectorAll('input[name="analytical-language"]:checked');
            if (checkboxes.length > 2) {
                e.target.checked = false;
                showNotification("Please select a maximum of two languages.", "error");
            }
        }
    });

    // --- Final Initialization ---
    loadStateFromLocalStorage();
    window.addEventListener('load', updateScrollMargin);
    window.addEventListener('resize', debounce(updateScrollMargin));

})();
