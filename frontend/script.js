document.addEventListener('DOMContentLoaded', function() {
    // Fix: errorContainer is not defined
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        console.error('Missing #error-container in HTML. Please add <div id="error-container"></div> to your page.');
        return;
    }
    // Configuration
    const API_URL = 'http://localhost:3001/api/schedules';
    const TERMS_API_URL = 'http://localhost:3001/api/terms';
    const MIN_TERM_LENGTH = 4;
    const MAX_TERM_LENGTH = 52;
    const DEFAULT_TERM_LENGTH = 15;

    // DOM Elements
    const addBtn = document.getElementById('add-course-btn');
    const removeBtn = document.getElementById('remove-course-btn');
    const weekSelect = document.getElementById('week-select');
    const termLengthInput = document.getElementById('term-length');
    const termList = document.getElementById('term-list');
    const newTermBtn = document.getElementById('new-term-btn');
    const newTermModal = document.getElementById('new-term-modal');
    const newTermForm = document.getElementById('new-term-form');
    const cancelTermModalBtn = document.getElementById('cancel-term-modal-btn');
    const modal = document.getElementById('add-course-modal');
    const modalBg = document.getElementById('modal-bg');
    const addCourseForm = document.getElementById('add-course-form');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const tbody = document.querySelector('table.schedule-table tbody');
    const clearNoticeBtn = document.getElementById('clear-notice-btn');

    // Guard all required elements
    const requiredElements = [addBtn, removeBtn, weekSelect, termLengthInput, termList, newTermBtn, newTermModal, newTermForm, cancelTermModalBtn, modal, modalBg, addCourseForm, cancelModalBtn, tbody];
    for (const el of requiredElements) {
        if (!el) {
            showError('A required UI element is missing. Please check your HTML.');
            return;
        }
    }

    // State
    let coursesByWeek = {};
    let currentWeek = 'default';
    let termLength = DEFAULT_TERM_LENGTH;
    let currentTermId = null;
    let terms = [];

    // Utility Functions
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        const successEl = document.createElement('div');
        successEl.className = 'success-message';
        successEl.textContent = message;
        document.body.appendChild(successEl);
        setTimeout(() => successEl.remove(), 3000);
    }

    // API Functions
    async function fetchWithErrorHandling(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            showError(`Operation failed: ${error.message}`);
            throw error;
        }
    }

    // Term Length Logic

    // Deprecated: fetchAndSetTermLength is not used for per-term logic anymore
    async function fetchAndSetTermLength() {
        // No-op: term length is now per-term, handled in switchTerm
    }

    async function saveTermLength(newLength) {
        await fetchWithErrorHandling(TERM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ termLength: newLength })
        });
        showSuccess('Term length updated successfully');
    }

    function validateCurrentWeek() {
        if (currentWeek !== 'default' && (parseInt(currentWeek, 10) > termLength)) {
            currentWeek = 'default';
            weekSelect.value = 'default';
            showError('Previously selected week is no longer available. Reset to default.');
        }
    }

    // Week Dropdown Logic
    function renderWeekOptions() {
        // Use the current term's length if available
        let len = termLength;
        const term = terms.find(t => t._id === currentTermId);
        if (term && term.termLength) {
            len = term.termLength;
        }
        weekSelect.innerHTML = '<option value="default">Default (All Remaining Weeks)</option>';
        for (let i = 1; i <= len; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `Week ${i}`;
            weekSelect.appendChild(opt);
        }
        // If currentWeek is out of range, reset to default
        if (currentWeek !== 'default' && (parseInt(currentWeek, 10) > len)) {
            currentWeek = 'default';
        }
        weekSelect.value = currentWeek;
    }

    // Schedule Data Management
    async function loadSchedules(termId = currentTermId) {
        try {
            let url = API_URL;
            if (termId) {
                url += `?termId=${encodeURIComponent(termId)}`;
            }
            const data = await fetchWithErrorHandling(url);
            coursesByWeek = data.reduce((acc, item) => {
                const week = item.week;
                if (!acc[week]) acc[week] = [];
                acc[week].push({ ...item });
                return acc;
            }, {});
            renderTable();
        } catch {
            coursesByWeek = {};
            renderTable();
        }
    }

    async function saveSchedule(schedule) {
        return await fetchWithErrorHandling(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...schedule, termId: currentTermId })
        });
    }

    async function updateNotice(scheduleId, notice) {
        return await fetchWithErrorHandling(`${API_URL}/${scheduleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notice })
        });
    }

    async function deleteSchedule(scheduleId) {
        return await fetchWithErrorHandling(`${API_URL}/${scheduleId}`, {
            method: 'DELETE'
        });
    }

    // Modal Functions
    function openModal() {
        modal.style.display = 'block';
        modalBg.style.display = 'block';
        const courseNameInput = document.getElementById('course-name');
        if (courseNameInput) courseNameInput.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        modalBg.style.display = 'none';
        addCourseForm.reset();
    }

    // Table Rendering
    function renderTable() {
        tbody.innerHTML = '';
        let weekCourses = [];
        if (currentWeek === 'default') {
            // Aggregate all courses for all weeks
            Object.values(coursesByWeek).forEach(arr => {
                if (Array.isArray(arr)) weekCourses.push(...arr);
            });
        } else {
            weekCourses = Array.isArray(coursesByWeek[currentWeek]) 
                ? [...coursesByWeek[currentWeek]] 
                : [];
        }

        const dayOrder = {
            'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
            'Thursday': 4, 'Friday': 5, 'Saturday': 6, 
            'Sunday': 7
        };

        weekCourses.sort((a, b) => {
            const aDay = dayOrder[a.days[0]] || 99;
            const bDay = dayOrder[b.days[0]] || 99;
            // Also sort by week if in default mode
            if (currentWeek === 'default') {
                const aWeek = parseInt(a.week, 10) || 0;
                const bWeek = parseInt(b.week, 10) || 0;
                if (aWeek !== bWeek) return aWeek - bWeek;
            }
            return aDay - bDay || a.startTime.localeCompare(b.startTime);
        });

        weekCourses.forEach((course, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="radio" name="select-course" value="${idx}"></td>
                <td>${course.name}<br><span class="instructor">${course.instructor}</span></td>
                <td>${course.startTime} - ${course.endTime}<br><span class="days">${course.days.join(', ')}</span></td>
                <td>${course.date || '-'}${currentWeek === 'default' ? ` (Week ${course.week})` : ''}</td>
                <td>
                    <input type="text" class="notice-input" data-id="${course._id}" 
                           value="${(course.notice || '').replace(/"/g, '&quot;')}" 
                           aria-label="Notice for ${course.name}">
                </td>
            `;
            tbody.appendChild(tr);
        });

        setupNoticeInputs();
        setupClearNoticesButton();
    }

    function setupNoticeInputs() {
        tbody.querySelectorAll('.notice-input').forEach(input => {
            let timeoutId;
            
            const saveNotice = async () => {
                const scheduleId = input.dataset.id;
                const newNotice = input.value.trim();
                
                try {
                    await updateNotice(scheduleId, newNotice);
                    // Update local state
                    const weekCourses = coursesByWeek[currentWeek];
                    if (weekCourses) {
                        const course = weekCourses.find(c => c._id === scheduleId);
                        if (course) course.notice = newNotice;
                    }
                } catch {
                    // Error is already handled by fetchWithErrorHandling
                }
            };

            input.addEventListener('input', () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(saveNotice, 1000);
            });

            input.addEventListener('blur', saveNotice);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                }
            });
        });
    }

    function setupClearNoticesButton() {
        if (!clearNoticeBtn) return;

        clearNoticeBtn.onclick = async function() {
            const weekCourses = coursesByWeek[currentWeek];
            
            if (!Array.isArray(weekCourses)) {
                showError('No courses found for this week');
                return;
            }

            if (!confirm('Clear all notices for this week? This cannot be undone.')) {
                return;
            }

            try {
                await Promise.all(weekCourses.map(course => {
                    if (course._id) {
                        return updateNotice(course._id, '');
                    }
                    return Promise.resolve();
                }));

                // Update local state
                weekCourses.forEach(course => {
                    course.notice = '';
                });
                
                renderTable();
                showSuccess('All notices cleared successfully');
            } catch {
                // Error is already handled by fetchWithErrorHandling
            }
        };
    }

    // Term Management
    async function loadTerms() {
        try {
            terms = await fetchWithErrorHandling(TERMS_API_URL);
            renderTermList();
        } catch (error) {
            showError('Failed to load terms');
        }
    }

    function renderTermList() {
        termList.innerHTML = '<option value="">Select a term...</option>';
        terms.forEach(term => {
            const opt = document.createElement('option');
            opt.value = term._id;
            opt.textContent = term.name;
            termList.appendChild(opt);
        });
        // Always set dropdown to currentTermId if available
        if (currentTermId && terms.some(t => t._id === currentTermId)) {
            termList.value = currentTermId;
        } else {
            termList.value = '';
        }
    }

    async function createNewTerm(termData) {
        // Only POST and return the new term
        return await fetchWithErrorHandling(TERMS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(termData)
        });
    }

    async function switchTerm(termId) {
        if (!termId) {
            coursesByWeek = {};
            currentTermId = null;
            termLength = DEFAULT_TERM_LENGTH;
            termLengthInput.value = DEFAULT_TERM_LENGTH;
            currentWeek = 'default';
            renderWeekOptions();
            renderTable();
            return;
        }

        try {
            // Always reload terms to get the latest info
            await loadTerms();
            const term = terms.find(t => t._id === termId);
            if (term) {
                currentTermId = termId;
                termLength = term.termLength;
                termLengthInput.value = term.termLength;
                currentWeek = 'default'; // Always reset week on term switch
                renderWeekOptions();
                weekSelect.value = currentWeek;
                await loadSchedules(currentTermId);
            }
        } catch (error) {
            showError('Failed to load term schedules');
        }
    }

    // Event Listeners for Term Management
    termList.addEventListener('change', function() {
        switchTerm(this.value);
    });

    newTermBtn.addEventListener('click', function() {
        newTermModal.style.display = 'block';
        modalBg.style.display = 'block';
        const termNameInput = document.getElementById('term-name');
        if (termNameInput) termNameInput.focus();
    });

    cancelTermModalBtn.addEventListener('click', function() {
        newTermModal.style.display = 'none';
        modalBg.style.display = 'none';
        newTermForm.reset();
    });

    newTermForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = newTermForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        let timeoutId = setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Term';
            showError('Request timed out. Please check your connection.');
        }, 15000); // 15s fallback
        try {
            const formData = new FormData(this);
            const name = formData.get('term-name');
            const termLength = parseInt(document.getElementById('new-term-length').value, 10);
            const startDate = formData.get('term-start-date');
            if (!name || !termLength || !startDate) {
                showError('Please fill in all fields');
                return;
            }
            const newTerm = await createNewTerm({ name, termLength, startDate });
            if (newTerm && newTerm._id) {
                // Robust retry: wait for the new term to appear in the backend (handles NeDB async flush)
                let foundTerm = null;
                for (let i = 0; i < 10; i++) { // up to 2s
                    await new Promise(res => setTimeout(res, 200));
                    await loadTerms();
                    foundTerm = terms.find(t => t._id === newTerm._id);
                    if (foundTerm) break;
                }
                if (foundTerm) {
                    currentTermId = foundTerm._id;
                    renderTermList();
                    termList.value = currentTermId;
                    await switchTerm(currentTermId);
                    showSuccess('New term created successfully');
                    newTermModal.style.display = 'none';
                    modalBg.style.display = 'none';
                    newTermForm.reset();
                } else {
                    // Fallback: reload terms and try to select the last one
                    await loadTerms();
                    if (terms.length > 0) {
                        currentTermId = terms[terms.length - 1]._id;
                        renderTermList();
                        termList.value = currentTermId;
                        await switchTerm(currentTermId);
                    }
                    showError('Term created but could not select it. Please reload.');
                }
            } else {
                showError('Term created but could not select it. Please reload.');
            }
        } catch (error) {
            if (error && error.message) {
                showError('Failed to create new term: ' + error.message);
            } else {
                showError('Failed to create new term.');
            }
        } finally {
            clearTimeout(timeoutId);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Term';
        }
    });

    // Event Handlers
    termLengthInput.addEventListener('change', async function() {
        if (!currentTermId) {
            showError('Please select a term first.');
            this.value = '';
            return;
        }
        const newLength = parseInt(this.value, 10);
        if (isNaN(newLength) || newLength < MIN_TERM_LENGTH || newLength > MAX_TERM_LENGTH) {
            showError(`Please enter a term length between ${MIN_TERM_LENGTH} and ${MAX_TERM_LENGTH} weeks.`);
            this.value = termLength;
            return;
        }
        try {
            const term = terms.find(t => t._id === currentTermId);
            if (!term) throw new Error('Current term not found.');
            await fetchWithErrorHandling(`${TERMS_API_URL}/${currentTermId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...term, termLength: newLength })
            });
            await loadTerms();
            termLength = newLength;
            renderWeekOptions();
            validateCurrentWeek();
            renderTable();
            showSuccess('Term length updated successfully');
        } catch (err) {
            showError('Failed to update term length.');
            this.value = termLength;
        }
    });

    weekSelect.addEventListener('change', function() {
        currentWeek = this.value;
        renderTable();
        updateWeekNavButtons();
    });

    // Previous/Next Week navigation
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');

    function updateWeekNavButtons() {
        if (!prevWeekBtn || !nextWeekBtn) return;
        const term = terms.find(t => t._id === currentTermId);
        const maxWeek = term && term.termLength ? term.termLength : DEFAULT_TERM_LENGTH;
        // Disable prev if on default or week 1
        if (currentWeek === 'default' || currentWeek === '1') {
            prevWeekBtn.disabled = true;
        } else {
            prevWeekBtn.disabled = false;
        }
        // Disable next if on default or last week
        if (currentWeek === 'default' || parseInt(currentWeek, 10) === maxWeek) {
            nextWeekBtn.disabled = true;
        } else {
            nextWeekBtn.disabled = false;
        }
    }

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', function() {
            if (currentWeek === 'default') {
                weekSelect.value = '1';
                currentWeek = '1';
            } else {
                const prev = Math.max(1, parseInt(currentWeek, 10) - 1);
                weekSelect.value = prev.toString();
                currentWeek = prev.toString();
            }
            renderTable();
            updateWeekNavButtons();
        });
    }
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', function() {
            const term = terms.find(t => t._id === currentTermId);
            const maxWeek = term && term.termLength ? term.termLength : DEFAULT_TERM_LENGTH;
            if (currentWeek === 'default') {
                weekSelect.value = '1';
                currentWeek = '1';
            } else {
                const next = Math.min(maxWeek, parseInt(currentWeek, 10) + 1);
                weekSelect.value = next.toString();
                currentWeek = next.toString();
            }
            renderTable();
            updateWeekNavButtons();
        });
    }

    addBtn.addEventListener('click', function() {
        addBtn.disabled = true;
        openModal();
        setTimeout(() => { addBtn.disabled = false; }, 500);
    });
    cancelModalBtn.addEventListener('click', closeModal);
    modalBg.addEventListener('click', function(e) {
        // Only close if clicking directly on the background, not on a modal
        if (e.target === modalBg) closeModal();
        if (e.target === modalBg && newTermModal.style.display === 'block') {
            newTermModal.style.display = 'none';
            newTermForm.reset();
        }
    });

    addCourseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const name = formData.get('course-name').trim();
        const instructor = formData.get('instructor-name').trim();
        const startTime = formData.get('start-time');
        const endTime = formData.get('end-time');
        const days = Array.from(formData.getAll('days'));
        if (!name || !instructor || !startTime || !endTime || days.length === 0) {
            showError('Please fill in all fields and select at least one day');
            return;
        }
        // Use startDate from the current term
        const term = terms.find(t => t._id === currentTermId);
        if (!term || !term.startDate) {
            showError('No start date found for the current term.');
            return;
        }
        const startDate = new Date(term.startDate);
        // If default, apply to all weeks in the term
        let targetWeeks;
        if (currentWeek === 'default') {
            // Add to all weeks in the term
            targetWeeks = Array.from({ length: term.termLength }, (_, i) => (i + 1).toString());
        } else {
            targetWeeks = [currentWeek];
        }
        const dayToIndex = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        try {
            // Always add the course to all weeks if default is selected
            await loadSchedules(currentTermId); // Ensure coursesByWeek is up to date
            const addPromises = [];
            for (const week of targetWeeks) {
                for (const day of days) {
                    // Check for duplicate in this week/day
                    const weekCourses = coursesByWeek[week] || [];
                    const duplicate = weekCourses.some(c =>
                        c.name === name &&
                        c.instructor === instructor &&
                        c.startTime === startTime &&
                        c.endTime === endTime &&
                        Array.isArray(c.days) && c.days[0] === day
                    );
                    if (duplicate) continue;
                    const weekStart = new Date(startDate);
                    weekStart.setDate(startDate.getDate() + (parseInt(week) - 1) * 7);
                    const dayIdx = dayToIndex[day];
                    const weekDay = new Date(weekStart);
                    weekDay.setDate(weekStart.getDate() + ((dayIdx - weekStart.getDay() + 7) % 7));
                    const dateStr = weekDay.toLocaleDateString('en-CA');
                    addPromises.push(
                        saveSchedule({
                            name,
                            instructor,
                            startTime,
                            endTime,
                            days: [day],
                            date: dateStr,
                            week,
                            notice: ''
                        })
                    );
                }
            }
            await Promise.all(addPromises);
            showSuccess('Course(s) added successfully');
            await loadSchedules(currentTermId);
            closeModal();
        } catch {
            // Error is already handled by fetchWithErrorHandling
        }
    });

    removeBtn.addEventListener('click', async function() {
        removeBtn.disabled = true;
        const selected = document.querySelector('input[name="select-course"]:checked');
        if (!selected || !coursesByWeek[currentWeek]) {
            showError('Please select a course to remove');
            removeBtn.disabled = false;
            return;
        }
        const idx = parseInt(selected.value, 10);
        const course = coursesByWeek[currentWeek][idx];
        if (!course || !course._id) {
            showError('Invalid course selection');
            removeBtn.disabled = false;
            return;
        }
        if (!confirm(`Are you sure you want to remove "${course.name}"?`)) {
            removeBtn.disabled = false;
            return;
        }
        try {
            await deleteSchedule(course._id);
            showSuccess('Course removed successfully');
            await loadSchedules(currentTermId);
        } catch {
            // Error is already handled by fetchWithErrorHandling
        } finally {
            removeBtn.disabled = false;
        }
    });

    // Prevent form submission on Enter in notice inputs
    document.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('notice-input') && e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    }, true);

    // Helper: Enable/disable term length input based on term selection
    function updateTermLengthInputState() {
        if (!currentTermId) {
            termLengthInput.disabled = true;
            termLengthInput.value = '';
        } else {
            termLengthInput.disabled = false;
        }
    }

    // Initialize
    (async function init() {
        try {
            await loadTerms();
            if (terms.length > 0) {
                // Always select the first term and update dropdown
                currentTermId = terms[0]._id;
                renderTermList();
                termList.value = currentTermId;
                await switchTerm(currentTermId);
            } else {
                // No terms, clear UI
                coursesByWeek = {};
                currentTermId = null;
                termLength = DEFAULT_TERM_LENGTH;
                termLengthInput.value = DEFAULT_TERM_LENGTH;
                currentWeek = 'default';
                renderWeekOptions();
                renderTable();
            }
            updateTermLengthInputState();
            updateWeekNavButtons();
        } catch (e) {
            showError('Failed to initialize app: ' + (e && e.message ? e.message : 'Unknown error'));
        }
    })();

    // Patch: update input state after switching terms
    const origSwitchTerm = switchTerm;
    switchTerm = async function(termId) {
        await origSwitchTerm(termId);
        updateTermLengthInputState();
    };
});