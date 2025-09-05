let currentActivity = null;
let startTime = null;
let activityLog = [];
let speedLog = [];
let intervalId = null;
let vehicle = "";
let driver = "";
const DEFAULT_SPEED_LIMIT = 100;
let alertShown = false;
let speedWatchId = null; // Identyfikator dla watchPosition

function startActivity() {
    const activity = document.getElementById("activitySelect").value;
    if (activity && !currentActivity) {
        currentActivity = activity;
        startTime = new Date();
        document.getElementById("status").textContent = `Aktualny status: ${currentActivity}`;
        intervalId = setInterval(updateTime, 1000);
        logActivity("Rozpoczęto: " + activity);
        logActivity("Uwaga: Limit prędkości ustawiony na 100 km/h. Dostosuj się do lokalnych przepisów!");
        alertShown = false;

        if (currentActivity === "Jazda") {
            updateSpeed();
        }
    } else {
        alert("Wybierz aktywność lub zakończ bieżącą!");
    }
}

function endActivity() {
    if (currentActivity && startTime) {
        clearInterval(intervalId);
        const endTime = new Date();
        const duration = Math.floor((endTime - startTime) / 1000);
        document.getElementById("status").textContent = "Aktualny status: Brak";
        currentActivity = null;
        startTime = null;
        logActivity(`Zakończono: ${currentActivity}, Czas: ${formatTime(duration)}`);

        if (speedWatchId) {
            navigator.geolocation.clearWatch(speedWatchId);
            speedWatchId = null;
        }
    }
}

function updateTime() {
    if (startTime) {
        const now = new Date();
        const duration = Math.floor((now - startTime) / 1000);
        document.getElementById("currentDuration").textContent = `Czas pracy/przerwy: ${formatTime(duration)}`;
        checkRemainingTime(duration);
    }
}

function updateSpeed() {
    if (currentActivity === "Jazda" && navigator.geolocation) {
        speedWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
                speedLog.push({ time: new Date(), speed: speed, limit: DEFAULT_SPEED_LIMIT, latitude: position.coords.latitude, longitude: position.coords.longitude });
                document.getElementById("status").textContent = `Aktualny status: ${currentActivity} (Prędkość: ${speed} km/h)`;
                checkSpeedLimit(speed);
            },
            (error) => {
                console.log("Błąd geolokalizacji:", error);
                document.getElementById("status").textContent = `Aktualny status: ${currentActivity} (Prędkość: Brak danych)`;
            },
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }
}

function checkSpeedLimit(speed) {
    if (speed > DEFAULT_SPEED_LIMIT) {
        logActivity(`Przekroczenie prędkości: ${speed} km/h (Limit: ${DEFAULT_SPEED_LIMIT} km/h) o ${new Date().toLocaleTimeString()}`);
    }
}

function checkRemainingTime(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const totalMinutes = hours * 60 + minutes;

    if (hours >= 4.5 && currentActivity === "Jazda" && !alertShown) {
        alert("Uwaga: Przekroczono 4,5h jazdy! Konieczne 45min przerwy.");
        alertShown = true;
        logActivity("Ostrzeżenie: Przekroczono 4,5h jazdy, wymagana przerwa.");
    }

    if ((currentActivity === "Przerwa" || currentActivity === "Odpoczynek") && alertShown) {
        alertShown = false;
    }

    if (hours >= 10 && currentActivity === "Jazda" && !alertShown) {
        alert("Uwaga: Przekroczono 10h jazdy! Wymagane 11h odpoczynku.");
        alertShown = true;
        logActivity("Ostrzeżenie: Przekroczono 10h jazdy, wymagane 11h odpoczynku.");
    }

    const remaining = 9 * 3600 - duration;
    document.getElementById("remainingTime").textContent = `Pozostały czas jazdy: ${formatTime(remaining > 0 ? remaining : 0)}`;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function logActivity(message) {
    const log = document.getElementById("log");
    log.innerHTML += `<p>${new Date().toLocaleString()} - ${message}</p>`;
    activityLog.push({ time: new Date(), message: message });
}

function saveDriver() {
    driver = document.getElementById("driverInput").value;
    const expiry = document.getElementById("driverCardExpiry").value;
    if (driver && expiry) {
        logActivity(`Zapisano kierowcę: ${driver}, Ważność: ${expiry}`);
    }
}

function saveVehicle() {
    vehicle = document.getElementById("vehicleInput").value;
    if (vehicle) {
        logActivity(`Zapisano pojazd: ${vehicle}`);
        document.getElementById("vehicle").textContent = `Pojazd: ${vehicle}`;
        const select = document.getElementById("vehicleSelect");
        const option = document.createElement("option");
        option.value = vehicle;
        option.text = vehicle;
        select.appendChild(option);
    }
}

function generateReport() {
    const period = document.getElementById("periodSelect").value;
    if (period) {
        let reportContent = `
            <h3>Raport - ${period}</h3>
            <p><strong>Kierowca:</strong> ${driver || "Nie podano"}</p>
            <p><strong>Pojazd:</strong> ${vehicle || "Nie wybrano"}</p>
            <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #2e3b3c; color: #ffffff;">
                        <th>Data/Czas</th>
                        <th>Aktywność</th>
                        <th>Prędkość (km/h)</th>
                        <th>Limit (km/h)</th>
                        <th>Czas trwania</th>
                        <th>Lokalizacja (approx.)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Filtruj activityLog i speedLog, łącząc dane
        activityLog.forEach((entry, index) => {
            const speedEntry = speedLog.find(s => s.time.toISOString().slice(0, 19) === entry.time.toISOString().slice(0, 19));
            const duration = index > 0 ? Math.floor((entry.time - activityLog[index - 1].time) / 1000) : 0;
            const location = speedEntry ? `${speedEntry.latitude.toFixed(2)}, ${speedEntry.longitude.toFixed(2)}` : "Brak danych";
            const speed = speedEntry ? speedEntry.speed : (entry.message.includes("Przekroczenie") ? parseInt(entry.message.match(/\d+/)[0]) : 0);
            const limit = speedEntry ? speedEntry.limit : DEFAULT_SPEED_LIMIT;

            reportContent += `
                <tr>
                    <td>${entry.time.toLocaleString()}</td>
                    <td>${entry.message.split(" - ")[1] || "Brak"}</td>
                    <td>${speed > 0 ? speed : "-"}</td>
                    <td>${limit}</td>
                    <td>${duration > 0 ? formatTime(duration) : "-"}</td>
                    <td>${location}</td>
                </tr>
            `;
        });

        reportContent += `
                </tbody>
            </table>
        `;

        const log = document.getElementById("log");
        log.innerHTML = reportContent;
    }
}

function saveReport() {
    const log = document.getElementById("log").innerHTML;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.fromHTML(log, 10, 10, { width: 180 });
    doc.save("raport.pdf");
}

function exportData() {
    const data = JSON.stringify({ activityLog, speedLog, driver, vehicle });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dane.json";
    a.click();
}

function resetApplication() {
    currentActivity = null;
    startTime = null;
    activityLog = [];
    speedLog = [];
    clearInterval(intervalId);
    if (speedWatchId) {
        navigator.geolocation.clearWatch(speedWatchId);
        speedWatchId = null;
    }
    document.getElementById("status").textContent = "Aktualny status: Brak";
    document.getElementById("remainingTime").textContent = "Pozostały czas jazdy: 09:00:00";
    document.getElementById("currentDuration").textContent = "Czas pracy/przerwy: 00:00:00";
    document.getElementById("vehicle").textContent = "Pojazd: Nie wybrano";
    document.getElementById("log").innerHTML = "";
    document.getElementById("driverInput").value = "";
    document.getElementById("driverCardExpiry").value = "";
    document.getElementById("vehicleInput").value = "";
    document.getElementById("vehicleSelect").innerHTML = "<option value=''>Wybierz pojazd</option>";
    alertShown = false;
}