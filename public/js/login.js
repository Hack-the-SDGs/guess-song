// defer 載入，DOM 已就緒
async function sendLogin() {
    const formData = new FormData();
    formData.append("username", document.getElementById("username").value);
    formData.append("password", document.getElementById("password").value);

    try {
        const res = await fetch("/api/login", { method: "POST", body: formData });
        const data = await res.json();
        if (data.status === 1) {
            localStorage.setItem("ntust_camp_token", data.token);
            window.location.href = "/dashboard";
        } else {
            alert(data.msg);
        }
    } catch {
        alert("網路錯誤，請再試一次");
    }
}

document.getElementById("submit").addEventListener("click", () => {
    void sendLogin();
});
