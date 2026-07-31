document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById('submit');

    function send_login() {
        username = document.getElementById("username").value;
        password = document.getElementById("password").value;

        const formData = new FormData()
        formData.append('username', username);
        formData.append('password', password);

        fetch('/api/login', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.status == 1) {
                    localStorage.setItem('ntust_camp_token', data.token);
                    window.location.href = '/dashboard';
                }
            });
    }

    btn.addEventListener('click', send_login);
});
