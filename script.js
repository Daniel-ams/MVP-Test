         // Convoking4 Snapshot Assessment
// Version: 9.2 (Phase 2 - Fixed)
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
    const returnToMenuButton = document.getElementById('return-to-menu-button');
    
    const form = document.getElementById('profile-form');
    const formContainer = document.getElementById('dynamic-form-content');
    const navLinksContainer = document.getElementById('nav-links-container');
    const saveButton = document.getElementById('generate-button');
    const orgFileLoader = document.getElementById('org-file-loader');
    const aiReportLoader = document.getElementById('ai-report-loader');
    
    const aiPromptModal = document.getElementById('ai-prompt-modal');
    const aiPromptOutput = document.getElementById('ai-prompt-output');
    const selectPromptButton = document.getElementById('select-prompt-button');
    const closeModalButtons = document.querySelectorAll('#close-modal-button-top, #close-modal-button-bottom');

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
        {
            title: "Section 1: Basic Information", id: "section-basic-info", path: "basicInfo",
            description: "Start with the basics. This helps identify the organization and its context.",
            parts: [
                createInputField("org-name", "1.1 Organization Name", "", "basicInfo.organizationName", "", "text", {required: true}),
                createInputField("org-year", "1.2 Year Founded", "", "basicInfo.yearFounded", "", "number"),
            ]
        },
        // ... Add other organizational sections here
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
        // ... Add other undertaking sections here
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
            showNotification('Please load the parent Organizational Snapshot file (.json).', 'info');
            orgFileLoader.click();
        });

        orgFileLoader.addEventListener('change', handleOrgFileLoadForUndertaking);
        aiReportLoader.addEventListener('change', handleAiReportLoad);
        returnToMenuButton.addEventListener('click', showChooserView);
    };

    const showChooserView = () => {
        appView.classList.add('hidden');
        chooserView.classList.remove('hidden');
        activeOrganization = null;
        currentAssessmentType = null;
        briefingContainer.classList.add('hidden');
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
                showNotification(`Loaded context from "${activeOrganization.basicInfo.organizationName}". Now, please load the corresponding AI Diagnostic Report (.md or .txt).`, 'success');
                aiReportLoader.click();

            } catch (error) {
                console.error('Error parsing organization file:', error);
                showNotification(error.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    const handleAiReportLoad = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            briefingContent.textContent = e.target.result;
            briefingContainer.classList.remove('hidden');
            currentAssessmentType = 'undertaking';
            renderForm(undertakingSections);
            showNotification(`AI Diagnostic Report loaded. You can now begin the Undertaking Snapshot.`, 'success');
        };
        reader.readAsText(file);
        event.target.value = null;
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
        }

        descriptor = 'snapshot';
        date = new Date().toISOString().split('T')[0];
        fileName = `${type}_${name}_${descriptor}_${date}.json`;

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
    
    const gatherFormData = () => {
        const data = { metadata: { type: currentAssessmentType } };
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

    const showNotification = (message, type = 'success') => {
        const banner = document.getElementById('notification-banner');
        if(!banner) return;
        banner.textContent = message;
        banner.className = `is-visible is-${type}`;
        setTimeout(() => { banner.className = ''; }, 4000);
    };

    // --- EVENT LISTENERS ---
    saveButton.addEventListener('click', saveProfileToFile);
    form.addEventListener('click', (e) => {
        if (e.target.id === 'consult-ai-button') {
            // Placeholder for AI Prompt Generation
            showNotification("AI Prompt generation is not fully implemented in this version.", "info");
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
    
    // --- INITIALIZATION ---
    initializeApp();

})();
