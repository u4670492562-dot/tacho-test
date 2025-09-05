// Dodaj na końcu pliku
function scrollActivity(direction) {
    const select = document.getElementById("activitySelect");
    let index = select.selectedIndex;
    if (direction === "up" && index > 1) index--;
    else if (direction === "down" && index < select.options.length - 1) index++;
    select.selectedIndex = index;
}

function setCountry() {
    const country = document.getElementById("countryInput").value.toUpperCase();
    if (country) {
        logActivity(`Ustawiono kraj: ${country}`);
        document.getElementById("lcdTop").textContent = `Kraj: ${country}`;
    }
}

function updateTime() {
    if (startTime) {
        const now = new Date();
        const duration = Math.floor((now - startTime) / 1000);
        document.getElementById("currentDuration").textContent = `Czas pracy/przerwy: ${formatTime(duration)}`;
        checkRemainingTime(duration);
        document.getElementById("lcdBottom").textContent = `Czas: ${formatTime(duration)}`;
        document.getElementById("lcdTop").textContent = `Status: ${currentActivity || "---"}`;
    }
}