window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
    window.history.go(1);
};

// Check authentication on page load (before anything else)
fetch('api/users', { method: 'GET' })
    .then(res => {
        if (res.status === 401) {
            window.location.href = 'login.html';
            throw new Error("Not authenticated");
        }
    })
    .catch(() => {
        window.location.href = 'login.html';
        throw new Error("Network/auth error");
    });

document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('#usersTable tbody');
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserFormContainer = document.getElementById('addUserFormContainer');
    const addUserForm = document.getElementById('addUserForm');
    const cancelAddUserBtn = document.getElementById('cancelAddUserBtn');
    const userListMsg = document.getElementById('userListMsg');
    const logoutBtn = document.getElementById('logoutBtn');
    const updateUserFormContainer = document.getElementById('updateUserFormContainer');
    const updateUserForm = document.getElementById('updateUserForm');
    const cancelUpdateUserBtn = document.getElementById('cancelUpdateUserBtn');
    const searchInput = document.getElementById('searchInput');
    let lastUsers = [];

    function showMsg(msg, type = "success") {
        const box = document.getElementById("userListMsg");
        box.innerHTML = `<span class="user-msg-${type}">${msg}</span>`;
        box.classList.add("active");
        clearTimeout(box.hideTimeout);
        box.hideTimeout = setTimeout(() => {
            box.classList.remove("active");
        }, 3800);
    }

    function renderUsers(users) {
        tableBody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.privilege}</td>
                <td>
                  <span class="status ${user.active ? 'delivered' : 'cancelled'}">
                    ${user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                    <button class="editBtn" data-id="${user.id}">Edit</button>
                    <button class="deleteBtn" data-id="${user.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Attach delete handlers
        document.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.onclick = function() {
                if(confirm("Are you sure you want to delete this user?")) {
                    fetch('api/users/' + btn.dataset.id, {
                        method: 'DELETE'
                    })
                    .then(res => {
                        if (!res.ok) throw new Error('Delete failed');
                        showMsg("User deleted successfully!", "success");
                        loadUsers();
                    })
                    .catch(err => {
                        showMsg("Delete error: " + err.message, "error");
                        console.error(err);
                    });
                }
            };
        });

        // Attach edit handlers
        document.querySelectorAll('.editBtn').forEach(btn => {
            btn.onclick = function() {
                const userId = btn.dataset.id;
                const user = lastUsers.find(u => u.id == userId);
                if (user) {
                    document.getElementById('updateUserId').value = user.id;
                    document.getElementById('updateUsername').value = user.username;
                    document.getElementById('updatePassword').value = ""; // blank to keep current password
                    document.getElementById('updatePrivilege').value = user.privilege;
                    document.getElementById('updateActive').value = user.active ? "true" : "false";
                    updateUserFormContainer.style.display = 'flex';
                }
            };
        });
    }

    function loadUsers() {
        fetch('api/users')
            .then(response => {
                if (!response.ok) throw new Error("Not authorized or error fetching users.");
                return response.json();
            })
            .then(users => {
                lastUsers = users;
                renderUsers(users);
            })
            .catch(err => {
                showMsg("Cannot load users: " + err.message, "error");
                console.error(err);
            });
    }

    if (tableBody) loadUsers();

    if (addUserBtn) {
        addUserBtn.onclick = function() {
            addUserForm.reset();
            addUserFormContainer.style.display = 'flex';
        };
    }
    if (cancelAddUserBtn) {
        cancelAddUserBtn.onclick = function() {
            addUserFormContainer.style.display = 'none';
        };
    }

    if (addUserForm) {
        addUserForm.onsubmit = function(e) {
            e.preventDefault();
            const formData = new FormData(addUserForm);
            const data = {
                username: formData.get('username'),
                password: formData.get('password'),
                privilege: formData.get('privilege'),
                active: formData.get('active') === "true"
            };
            fetch('api/users', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            .then(res => {
                if (!res.ok) throw new Error('Add failed');
                addUserFormContainer.style.display = 'none';
                addUserForm.reset();
                showMsg("User added successfully!", "success");
                loadUsers();
            })
            .catch(err => {
                showMsg("Add error: " + err.message, "error");
                console.error(err);
            });
        };
    }

    if (cancelUpdateUserBtn) {
        cancelUpdateUserBtn.onclick = function() {
            updateUserFormContainer.style.display = 'none';
        };
    }

    if (updateUserForm) {
        updateUserForm.onsubmit = function(e) {
            e.preventDefault();
            const userId = document.getElementById('updateUserId').value;
            const username = document.getElementById('updateUsername').value;
            const password = document.getElementById('updatePassword').value;
            const privilege = document.getElementById('updatePrivilege').value;
            const active = document.getElementById('updateActive').value === "true";

            const data = { username, privilege, active };
            if (password) data.password = password; // Only send password if changed

            fetch('api/users/' + userId, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            .then(res => {
                if (!res.ok) throw new Error('Update failed');
                updateUserFormContainer.style.display = 'none';
                showMsg("User updated successfully!", "success");
                loadUsers();
            })
            .catch(err => {
                showMsg("Update error: " + err.message, "error");
                console.error(err);
            });
        };
    }

    // Logout handler (only once!)
	if (logoutBtn) {
	    logoutBtn.onclick = function() {
	        if (confirm("Are you sure you want to log out?")) {
	            fetch('api/logout', { method: 'POST' })
	                .then(() => {
	                    showMsg("Logged out successfully!", "success");
	                    setTimeout(() => window.location.replace('login.html'), 1000);
	                })
	                .catch(() => window.location.replace('login.html'));
	        }
	    };
	}

    // Search filter
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const q = searchInput.value.toLowerCase();
            renderUsers(lastUsers.filter(u =>
                u.username.toLowerCase().includes(q) ||
                u.privilege.toLowerCase().includes(q) ||
                (u.active ? 'active' : 'inactive').includes(q)
            ));
        });
    }
});
