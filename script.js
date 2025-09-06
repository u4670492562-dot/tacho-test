let currentActivity = null;
let startTime = null;
let activityLog = [];
let speedLog = [];
let intervalId = null;
let vehicle = "";
let alertShown = false;
let speedWatchId = null;
let cardInserted = { driverSlot1: false };
let activityOptions = ["Ⓙ", "Ⓘ", "Ⓟ", "Ⓞ"];
let currentOptionIndex = 0;

function scrollActivity(direction) {
    if (direction === "up" && currentOptionIndex > 0) currentOptionIndex--;
    else if (direction === "down" && currentOptionIndex < activityOptions.length - 1) currentOptionIndex++;
    document.getElementById("lcdTop").textContent = `Status: ${activityOptions[currentOptionIndex]}`;
}

function selectActivity() {
    if (!currentActivity && cardInserted.driverSlot1) {
        const activities = ["Jazda", "Inna praca", "Przerwa", "Odpoczynek 11h"];
        currentActivity = activities[currentOptionIndex];
        startTime = new Date();
        intervalId = setInterval(updateTime, 1000);
        logActivity(`Rozpoczęto: ${currentActivity}`);
        if (currentActivity === "Jazda") {
            updateSpeed();
        } else if (currentActivity === "Odpoczynek 11h") {
            checkRestDuration();
        }
    }
}

function endActivity() {
    if (currentActivity && startTime) {
        clearInterval(intervalId);
        const endTime = new Date();
        const duration = Math.floor((endTime - startTime) / 1000);
        logActivity(`Zakończono: ${currentActivity}, Czas: ${formatTime(duration)}`);
        currentActivity = null;
        startTime = null;
        if (speedWatchId) {
            navigator.geolocation.clearWatch(speedWatchId);
            speedWatchId = null;
        }
    }
}

function goBack() {
    currentActivity = null;
    clearInterval(intervalId);
    document.getElementById("lcdTop").textContent = `Status: Ⓟ`;
}

function updateTime() {
    if (startTime) {
        const now = new Date();
        const duration = Math.floor((now - startTime) / 1000);
        document.getElementById("lcdBottom").textContent = `Czas: ${formatTime(duration)}`;
        const activities = ["Jazda", "Inna praca", "Przerwa", "Odpoczynek 11h"];
        document.getElementById("lcdTop").textContent = `Status: ${activityOptions[activities.indexOf(currentActivity)] || activityOptions[currentOptionIndex]}`;
        if (currentActivity === "Jazda" && duration / 3600 >= 4.5 && !alertShown) {
            alert("Potrzebna przerwa po 4,5h jazdy!");
            alertShown = true;
        }
    } else {
        const now = new Date();
        document.getElementById("lcdBottom").textContent = `Czas: ${now.toLocaleTimeString()}`;
        document.getElementById("lcdTop").textContent = `Status: ${activityOptions[currentOptionIndex]}`;
    }
}

function updateSpeed() {
    if (currentActivity === "Jazda" && navigator.geolocation) {
        speedWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
                speedLog.push({ time: new Date(), speed: speed, latitude: position.coords.latitude, longitude: position.coords.longitude, limit: 100 });
                document.getElementById("lcdTop").textContent = `Status: Ⓙ (${speed} km/h)`;
            },
            (error) => {
                console.log("Błąd geolokalizacji:", error);
            },
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }
}

function checkRestDuration() {
    if (currentActivity === "Odpoczynek 11h") {
        const now = new Date();
        const duration = Math.floor((now - startTime) / 1000);
        if (duration / 3600 >= 11) {
            alert("Odpoczynek 11h zakończony. Możesz kontynuować.");
            endActivity();
        }
    }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function logActivity(message) {
    activityLog.push({ time: new Date(), message: message });
}

function saveVehicle() {
    vehicle = document.getElementById("vehicleSelect").value;
    logActivity(`Wybrano lawetę: ${vehicle}`);
}

function toggleCard(slotId) {
    const slot = document.getElementById(slotId).parentElement;
    cardInserted[slotId] = !cardInserted[slotId];
    if (cardInserted[slotId]) {
        slot.classList.add("inserted");
    } else {
        slot.classList.remove("inserted");
    }
}

function generateReport() {
    const reportOutput = document.getElementById("reportOutput");
    let reportContent = `
        <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse; color: #fff; background: #333;">
            <thead>
                <tr>
                    <th>Czas</th>
                    <th>Aktywność</th>
                    <th>Prędkość (km/h)</th>
                    <th>Czas trwania</th>
                    <th>Lokalizacja</th>
                </tr>
            </thead>
            <tbody>
    `;

    activityLog.forEach((entry, index) => {
        const speedEntry = speedLog.find(s => s.time.toISOString().slice(0, 19) === entry.time.toISOString().slice(0, 19));
        const duration = index > 0 ? Math.floor((entry.time - activityLog[index - 1].time) / 1000) : 0;
        const location = speedEntry ? `${speedEntry.latitude?.toFixed(2) || 0}, ${speedEntry.longitude?.toFixed(2) || 0}` : "Brak danych";
        const speed = speedEntry ? speedEntry.speed : 0;
        const activity = entry.message.split(": ")[1] || "Brak";

        reportContent += `
            <tr>
                <td>${entry.time.toLocaleString()}</td>
                <td>${activity}</td>
                <td>${speed}</td>
                <td>${duration > 0 ? formatTime(duration) : "-"}</td>
                <td>${location}</td>
            </tr>
        `;
    });

    reportContent += `
            </tbody>
        </table>
    `;
    reportOutput.innerHTML = reportContent;
}

function printReport() {
    const reportOutput = document.getElementById("reportOutput").innerHTML;
    if (reportOutput) {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
            <html>
                <head><title>Raport Tachografu</title>
                <style>
                    body { font-family: "Courier New", Courier, monospace; background: #fff; color: #000; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                    th { background: #ddd; }
                </style>
                </head>
                <body>${reportOutput}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    } else {
        alert("Najpierw wygeneruj raport!");
    }
}

function saveReport() {
    const reportOutput = document.getElementById("reportOutput").innerHTML;
    if (reportOutput) {
        const blob = new Blob([reportOutput], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `raport_tachograf_${new Date().toLocaleDateString()}.html`;
        link.click();
    } else {
        alert("Najpierw wygeneruj raport!");
    }
}