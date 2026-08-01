// defer 載入，DOM 已就緒；refreshScores 來自 /js/scores.js
const TOKEN_KEY = "ntust_camp_token";

if (!localStorage.getItem(TOKEN_KEY)) {
    window.location.href = "/login";
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
}

// ponytail: token 過期就直接踢回登入頁，沒有 refresh 機制
async function post(url, payload) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token: localStorage.getItem(TOKEN_KEY), ...payload }),
        });

        if (res.status === 401) return logout();

        const data = await res.json();
        if (data.status === 1) {
            void refreshScores();
        } else {
            alert(data.msg);
        }
    } catch {
        alert("網路錯誤，請再試一次");
    }
}

document.getElementById("add_score_btn").addEventListener("click", () => {
    void post("/api/AddScore", {
        group: document.getElementById("group").valueAsNumber,
        year: document.getElementById("year").checked,
        name: document.getElementById("name").checked,
        sing: document.getElementById("sing").checked,
        dance: document.getElementById("dance").checked,
    });
});

document.getElementById("set_score_btn").addEventListener("click", () => {
    void post("/api/SetScore", {
        group: document.getElementById("group_set").valueAsNumber,
        score: document.getElementById("score").valueAsNumber,
    });
});

document.getElementById("logout_btn").addEventListener("click", logout);
