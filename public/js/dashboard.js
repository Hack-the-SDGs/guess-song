document.addEventListener("DOMContentLoaded", () => {
    const TOKEN_KEY = 'ntust_camp_token';

    if (!localStorage.getItem(TOKEN_KEY)) {
        window.location.href = '/login';
        return;
    }

    function updataScore(data) {
        for (var i = 1; i < 7; i++) {
            const i_str = i.toString();
            const firstTextarea = document.getElementById("t" + i_str).querySelector("textarea");
            firstTextarea.textContent = data[i_str].toString()
        }
    }

    async function getAndUpdate() {
        const res = await fetch("/api/GetScore");
        const data = await res.json();
        updataScore(data);
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
    }

    // ponytail: token 過期就直接踢回登入頁，沒有 refresh 機制
    async function post(url, json_data) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json_data)
        });

        if (res.status === 401) {
            logout();
            return;
        }

        const data = await res.json();
        if (data.status == 1) {
            getAndUpdate();
        } else {
            alert(data.msg);
        }
    }

    function add_score() {
        post('/api/AddScore', {
            token: localStorage.getItem(TOKEN_KEY),
            group: document.getElementById('group').valueAsNumber,
            year: document.getElementById('year').checked,
            name: document.getElementById('name').checked,
            sing: document.getElementById('sing').checked,
            dance: document.getElementById('dance').checked
        });
    }

    function set_score() {
        post('/api/SetScore', {
            token: localStorage.getItem(TOKEN_KEY),
            group: document.getElementById('group_set').valueAsNumber,
            score: document.getElementById('score').valueAsNumber
        });
    }

    document.getElementById('add_score_btn').addEventListener('click', add_score);
    document.getElementById('set_score_btn').addEventListener('click', set_score);
    document.getElementById('logout_btn').addEventListener('click', logout);

    getAndUpdate()

    setInterval(getAndUpdate, 1000);
});
