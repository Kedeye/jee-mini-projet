window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
    window.history.go(1);
};

let currentUserRole = null;

// Step 1: Get current user info (role)
fetch('api/me')
    .then(res => {
        if (res.status === 401) {
            window.location.href = 'login.html';
            throw new Error("Non authentifié");
        }
        return res.json();
    })
    .then(user => {
        currentUserRole = user.privilege; // "ADMIN" or "USER"
        document.dispatchEvent(new Event("userReady")); // Trigger rest of code
    })
    .catch(() => {
        window.location.href = 'login.html';
        throw new Error("Erreur réseau/authentification");
    });

document.addEventListener('userReady', function() {
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
        }, 3000);
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
                    <button class="editBtn" data-id="${user.id}">Modifier</button>
                    <button class="deleteBtn" data-id="${user.id}">Supprimer</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Attach handlers for all, but check inside the handler!
        document.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.onclick = function() {
                if(currentUserRole !== 'ADMIN') {
                    showMsg("Vous n’avez pas la permission", "error");
                    return;
                }
                if(confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
                    fetch('api/users/' + btn.dataset.id, {
                        method: 'DELETE'
                    })
                    .then(res => {
                        if (!res.ok) throw new Error('Échec de la suppression');
                        showMsg("Utilisateur supprimé avec succès !", "success");
                        loadUsers();
                    })
                    .catch(err => {
                        showMsg("Erreur lors de la suppression: " + err.message, "error");
                        console.error(err);
                    });
                }
            };
        });

        document.querySelectorAll('.editBtn').forEach(btn => {
            btn.onclick = function() {
                if(currentUserRole !== 'ADMIN') {
                    showMsg("Vous n’avez pas la permission", "error");
                    return;
                }
                const userId = btn.dataset.id;
                const user = lastUsers.find(u => u.id == userId);
                if (user) {
                    document.getElementById('updateUserId').value = user.id;
                    document.getElementById('updateUsername').value = user.username;
                    document.getElementById('updatePassword').value = "";
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
                if (!response.ok) throw new Error("NNon autorisé ou erreur lors du chargement des utilisateurs.");
                return response.json();
            })
            .then(users => {
                lastUsers = users;
                renderUsers(users);
            })
            .catch(err => {
                showMsg("Impossible de charger les utilisateurs: " + err.message, "error");
                console.error(err);
            });
    }

    if (tableBody) loadUsers();

    // Only ADMIN can open the Add User form
    if (addUserBtn) {
        addUserBtn.onclick = function() {
            if(currentUserRole !== 'ADMIN') {
                showMsg("Vous n’avez pas la permission", "error");
                return;
            }
            addUserForm.reset();
            addUserFormContainer.style.display = 'flex';
        };
    }
    if (cancelAddUserBtn) {
        cancelAddUserBtn.onclick = function() {
            addUserFormContainer.style.display = 'none';
        };
    }

    // Add user (will be blocked by backend if not ADMIN, but frontend checks first)
    if (addUserForm) {
        addUserForm.onsubmit = function(e) {
            e.preventDefault();
            if(currentUserRole !== 'ADMIN') {
                showMsg("Vous n’avez pas la permission", "error");
                return;
            }
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
                showMsg("Utilisateur ajouté avec succès !", "success");
                loadUsers();
            })
            .catch(err => {
                showMsg("Ajouter error: " + err.message, "error");
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
            if(currentUserRole !== 'ADMIN') {
                showMsg("Vous n’avez pas la permission", "error");
                return;
            }
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
                if (!res.ok) throw new Error('Erreur lors de la mise à jour');
                updateUserFormContainer.style.display = 'none';
                showMsg("Utilisateur modifié avec succès !", "success");
                loadUsers();
            })
            .catch(err => {
                showMsg("Erreur lors de la mise à jour: " + err.message, "error");
                console.error(err);
            });
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = function() {
            if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
                fetch('api/logout', { method: 'POST' })
                    .then(() => {
                        showMsg("Déconnexion réussie !", "success");
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
