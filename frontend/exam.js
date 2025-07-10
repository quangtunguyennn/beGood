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

    // --- Exam Backend Integration ---
    const API_BASE = 'http://localhost:4003/api';

    function renderExams(exams) {
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
            tr.dataset.id = exam._id;
            examList.appendChild(tr);
        });
    }

    function loadExams() {
        fetch(`${API_BASE}/exams`)
            .then(res => res.json())
            .then(renderExams)
            .catch(() => addNotice('Failed to load exams from server.'));
    }

    function addExam(title, subject, date, time) {
        fetch(`${API_BASE}/exams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, subject, date, time })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data._id) {
                loadExams();
                addNotice(`Exam "${title}" added!`);
            } else {
                addNotice('Failed to add exam.');
            }
        })
        .catch(() => addNotice('Failed to add exam.'));
    }

    function deleteExam(id, title) {
        fetch(`${API_BASE}/exams/${id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    loadExams();
                    addNotice(`Exam "${title}" deleted.`);
                } else {
                    addNotice('Failed to delete exam.');
                }
            })
            .catch(() => addNotice('Failed to delete exam.'));
    }

    function removeDoneExams() {
        fetch(`${API_BASE}/exams`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                loadExams();
                addNotice('Removed all done exams.');
            })
            .catch(() => addNotice('Failed to remove done exams.'));
    }

    function updateExamDone(id, done, title) {
        fetch(`${API_BASE}/exams/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done })
        })
        .then(res => res.json())
        .then(() => {
            loadExams();
            addNotice(`Exam "${title}" marked as ${done ? 'done' : 'not done'}.`);
        })
        .catch(() => addNotice('Failed to update exam.'));
    }

    // --- Notices Backend Integration ---
    function renderNotices(noticeArr) {
        notices.innerHTML = '';
        noticeArr.forEach(msg => {
            const li = document.createElement('li');
            li.textContent = msg;
            notices.appendChild(li);
        });
        notices.scrollTop = notices.scrollHeight;
    }
    function loadNotices() {
        fetch(`${API_BASE}/notices`)
            .then(res => res.json())
            .then(renderNotices)
            .catch(() => {});
    }
    function addNotice(msg) {
        fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        })
        .then(() => loadNotices())
        .catch(() => {});
    }
    if (clearNoticesBtn && notices) {
        clearNoticesBtn.addEventListener('click', function() {
            fetch(`${API_BASE}/notices`, { method: 'DELETE' })
                .then(() => loadNotices());
        });
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
        addExam(title, subject, date, time);
        closeModal();
    });

    // Delete exam
    examList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const id = row.dataset.id;
            const title = row.children[1].textContent;
            if (id) deleteExam(id, title);
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
            removeDoneExams();
        });
    }

    // Checkbox event
    examList.addEventListener('change', function(e) {
        if (e.target.classList.contains('done-checkbox')) {
            const row = e.target.closest('tr');
            const id = row.dataset.id;
            const title = row.children[1].textContent;
            if (id) updateExamDone(id, e.target.checked, title);
        }
    });

    // Initial load
    loadExams();
    loadNotices();
});
