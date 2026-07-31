document.addEventListener("DOMContentLoaded", () => {
    function updataScore(data) {
        for(var i = 1; i < 7; i++) {
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

    getAndUpdate()

    setInterval(async () => {
        getAndUpdate();
    }, 3000);
});
