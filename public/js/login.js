document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById('submit');

    function send_login() {
        const formData = new FormData()
        formData.append('username', document.getElementById("username").value);
        formData.append('password', document.getElementById("password").value);

        fetch('/api/login', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.status == 1) {
                    localStorage.setItem('ntust_camp_token', data.token);
                    window.location.href = '/dashboard';
                } else {
                    alert(data.msg);
                }
            });
    }

    btn.addEventListener('click', send_login);
});
