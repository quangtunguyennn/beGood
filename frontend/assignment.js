document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const assignmentList = document.getElementById('assignment-list');
    const notices = document.getElementById('notices');
    const addAssignmentBtn = document.getElementById('add-assignment-btn');
    const addAssignmentModal = document.getElementById('add-assignment-modal');
    const modalBg = document.getElementById('modal-bg');
    const addAssignmentForm = document.getElementById('add-assignment-form');
    const modalTitleInput = document.getElementById('modal-assignment-title');
    const modalDateInput = document.getElementById('modal-assignment-date');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const removeAssignmentBtn = document.getElementById('remove-assignment-btn');
    const clearNoticesBtn = document.getElementById('clear-notices-btn');

    // Backend API base URL
    const API_BASE = 'http://localhost:4002/api';

    // --- Assignment Backend Integration ---
    // Render assignments from backend
    function renderAssignments(assignments) {
        assignmentList.innerHTML = '';
        assignments.forEach(assignment => {
            const tr = document.createElement('tr');
            tr.dataset.id = assignment._id;
            tr.innerHTML = `
                <td><input type="checkbox" class="done-checkbox" ${assignment.done ? 'checked' : ''}></td>
                <td>${assignment.title}</td>
                <td>${assignment.dueDate}</td>
                <td><button class="btn delete-btn">Delete</button></td>
            `;
            if (assignment.done) tr.style.textDecoration = 'line-through';
            assignmentList.appendChild(tr);
        });
    }

    // Load assignments from backend
    function loadAssignments() {
        fetch(`${API_BASE}/assignments`)
            .then(res => res.json())
            .then(renderAssignments)
            .catch(() => addNotice('Failed to load assignments from server.'));
    }

    // Add assignment to backend
    function addAssignment(title, dueDate) {
        fetch(`${API_BASE}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, dueDate })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data._id) {
                loadAssignments();
                addNotice(`Assignment "${title}" added!`);
            } else {
                addNotice('Failed to add assignment.');
            }
        })
        .catch(() => addNotice('Failed to add assignment.'));
    }

    // Delete assignment from backend
    function deleteAssignment(id, title) {
        fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    loadAssignments();
                    addNotice(`Assignment "${title}" deleted.`);
                } else {
                    addNotice('Failed to delete assignment.');
                }
            })
            .catch(() => addNotice('Failed to delete assignment.'));
    }

    // Remove all assignments marked as done
    function removeDoneAssignments() {
        fetch(`${API_BASE}/assignments`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                loadAssignments();
                addNotice('Removed all done assignments.');
            })
            .catch(() => addNotice('Failed to remove done assignments.'));
    }

    // Mark assignment as done/undone
    function updateAssignmentDone(id, done, title) {
        fetch(`${API_BASE}/assignments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done })
        })
        .then(res => res.json())
        .then(data => {
            loadAssignments();
            addNotice(`Assignment "${title}" marked as ${done ? 'done' : 'not done'}.`);
        })
        .catch(() => addNotice('Failed to update assignment.'));
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

    // Open modal
    addAssignmentBtn.addEventListener('click', function() {
        addAssignmentModal.style.display = 'block';
        modalBg.style.display = 'block';
        modalTitleInput.value = '';
        modalDateInput.value = '';
        modalTitleInput.focus();
    });

    // Close modal
    function closeModal() {
        addAssignmentModal.style.display = 'none';
        modalBg.style.display = 'none';
        addAssignmentForm.reset();
    }
    cancelModalBtn.addEventListener('click', closeModal);
    modalBg.addEventListener('click', function(e) {
        if (e.target === modalBg) closeModal();
    });

    // Add assignment from modal
    addAssignmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = modalTitleInput.value.trim();
        const date = modalDateInput.value;
        if (!title || !date) return;
        addAssignment(title, date);
        closeModal();
    });

    // Delete assignment
    assignmentList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const row = e.target.closest('tr');
            const id = row.dataset.id;
            const title = row.children[1].textContent;
            if (id) deleteAssignment(id, title);
        }
    });

    // Remove selected assignments (removes all done assignments)
    if (removeAssignmentBtn) {
        removeAssignmentBtn.addEventListener('click', function() {
            // Remove all assignments marked as done
            const checked = assignmentList.querySelectorAll('.done-checkbox:checked');
            if (checked.length === 0) {
                addNotice('No assignments selected for removal.');
                return;
            }
            removeDoneAssignments();
        });
    }

    // Checkbox event
    assignmentList.addEventListener('change', function(e) {
        if (e.target.classList.contains('done-checkbox')) {
            const row = e.target.closest('tr');
            const id = row.dataset.id;
            const title = row.children[1].textContent;
            if (id) updateAssignmentDone(id, e.target.checked, title);
        }
    });

    // Initial load
    loadAssignments();
    loadNotices();
});
