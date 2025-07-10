document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const examList = document.getElementById('exam-list');
    const notices = document.getElementById('notices');
    const addExamBtn = document.getElementById('add-exam-btn');
    const addExamModal = document.getElementById('add-exam-modal');
    const modalBg = document.getElementById('modal-bg');
    const addExamForm = document.getElementById('add-exam-form');
    const modalTitleInput = document.getElementById('modal-exam-title');
    const modalSubjectInput = document.getElementById('modal-exam-subject');
    const modalDateInput = document.getElementById('modal-exam-date');
    const modalTimeInput = document.getElementById('modal-exam-time');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const removeExamBtn = document.getElementById('remove-exam-btn');
    const clearNoticesBtn = document.getElementById('clear-notices-btn');

    // --- Exam Data (in-memory for now) ---
    let exams = [];

    function renderExams() {
        examList.innerHTML = '';
        exams.forEach((exam, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="done-checkbox" ${exam.done ? 'checked' : ''}></td>
                <td>${exam.title}</td>
                <td>${exam.subject || ''}</td>
                <td>${exam.date}</td>
                <td>${exam.time}</td>
                <td><button class="btn delete-btn">Delete</button></td>
            `;
            if (exam.done) tr.style.textDecoration = 'line-through';
            tr.dataset.idx = idx;
            examList.appendChild(tr);
        });
    }

    function addNotice(msg) {
        const li = document.createElement('li');
        li.textContent = msg;
        notices.appendChild(li);
        notices.scrollTop = notices.scrollHeight;
    }

    if (clearNoticesBtn && notices) {
        clearNoticesBtn.addEventListener('click', function() {
            notices.innerHTML = '';
        });
    }

    // Open modal
    addExamBtn.addEventListener('click', function() {
        addExamModal.style.display = 'block';
        modalBg.style.display = 'block';
        modalTitleInput.value = '';
        modalSubjectInput.value = '';
        modalDateInput.value = '';
        modalTimeInput.value = '';
        modalTitleInput.focus();
    });

    // Close modal
    function closeModal() {
        addExamModal.style.display = 'none';
        modalBg.style.display = 'none';
        addExamForm.reset();
    }
    cancelModalBtn.addEventListener('click', closeModal);
    modalBg.addEventListener('click', function(e) {
        if (e.target === modalBg) closeModal();
    });

    // Add exam from modal
    addExamForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = modalTitleInput.value.trim();
        const subject = modalSubjectInput.value.trim();
        const date = modalDateInput.value;
        const time = modalTimeInput.value;
        if (!title || !subject || !date || !time) return;
        exams.push({ title, subject, date, time, done: false });
        renderExams();
        addNotice(`Exam "${title}" added!`);
        closeModal();
    });

    // Delete exam
    examList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const idx = row.dataset.idx;
            const title = row.children[1].textContent;
            exams.splice(idx, 1);
            renderExams();
            addNotice(`Exam "${title}" deleted.`);
        }
    });

    // Remove selected exams
    if (removeExamBtn) {
        removeExamBtn.addEventListener('click', function() {
            const checked = examList.querySelectorAll('.done-checkbox:checked');
            if (checked.length === 0) {
                addNotice('No exams selected for removal.');
                return;
            }
            // Remove from end to start to avoid index issues
            const idxs = Array.from(checked).map(box => parseInt(box.closest('tr').dataset.idx)).sort((a,b)=>b-a);
            idxs.forEach(idx => {
                const title = exams[idx].title;
                exams.splice(idx, 1);
                addNotice(`Exam "${title}" removed.`);
            });
            renderExams();
        });
    }

    // Checkbox event
    examList.addEventListener('change', function(e) {
        if (e.target.classList.contains('done-checkbox')) {
            const row = e.target.closest('tr');
            const idx = row.dataset.idx;
            const title = row.children[1].textContent;
            exams[idx].done = e.target.checked;
            renderExams();
            addNotice(`Exam "${title}" marked as ${e.target.checked ? 'done' : 'not done'}.`);
        }
    });

    // Initial render
    renderExams();
});
