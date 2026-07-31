document.addEventListener("DOMContentLoaded", () => {
    function updataScore(data) {
        for(var i = 1; i < 7; i++) {
            i_str = i.toString();
            const firstTextarea = document.getElementById("t" + i_str).querySelector("textarea");
            firstTextarea.textContent = data[i_str].toString()
        }
    }

    async function getAndUpdate() {
        const res = await fetch("/api/GetScore");
        const data = await res.json();
        updataScore(data);
    }

    function add_score() {
        const formData = new FormData()

        formData.append("group", document.getElementById('group').valueAsNumber)
        formData.append("year", document.getElementById('year').checked)
        formData.append("name", document.getElementById('name').checked)
        formData.append("SD", document.getElementById('SD').checked)

        const json_data = {
            token: localStorage.getItem('ntust_camp_token'),
            group: document.getElementById('group').valueAsNumber,
            year: document.getElementById('year').checked,
            name: document.getElementById('name').checked,
            SD: document.getElementById('SD').checked
        };

        fetch('/api/AddScore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(json_data)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status == 1) {
                    getAndUpdate();
                }
            });
    }

    function set_score() {
        const formData = new FormData()

        formData.append("token", localStorage.getItem('ntust_camp_token'))
        formData.append("group", document.getElementById('group_set').valueAsNumber)
        formData.append("score", document.getElementById('score').valueAsNumber)

        fetch('/api/SetScore', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.status == 1) {
                    getAndUpdate();
                }
            });
    }

    function logout(){
        const formData = new FormData()

        formData.append("token", localStorage.getItem('ntust_camp_token'))

        fetch('/api/logout', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.status == 1) {
                    window.location.href = '/login';
                }
            });
    }

    const add_score_btn = document.getElementById('add_score_btn');
    const set_score_btn = document.getElementById('set_score_btn');
    const logout_btn = document.getElementById('logout_btn');

    add_score_btn.addEventListener('click', add_score)
    set_score_btn.addEventListener('click', set_score)
    logout_btn.addEventListener('click', logout)

    getAndUpdate()

    setInterval(async () => {
        getAndUpdate();
    }, 3000);
});
