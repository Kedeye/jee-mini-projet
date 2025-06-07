window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
    window.history.go(1);
};

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const spinner = document.getElementById('loadingSpinner');
            const msg = document.getElementById('loginMsg');
            const btn = form.querySelector('button[type="submit"]');

            // Hide error, show spinner, disable button
            msg.innerText = "";
            spinner.style.display = "block";
            btn.disabled = true;

            try {
                const res = await fetch('api/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
                });

                spinner.style.display = "none";
                btn.disabled = false;

                if (res.ok) {
                    // On success, redirect—show NO message
                    window.location.replace('user_list.html');
                } else {
                    msg.innerText = "Échec de la connexion. Vérifiez vos identifiants.";
                }
            } catch (err) {
                spinner.style.display = "none";
                btn.disabled = false;
                msg.innerText = "Erreur réseau. Réessayez.";
            }
        });
    }
});
