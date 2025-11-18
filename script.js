let items = [];
let index = 0;

let smashData = {};   // { itemName: "smash" or "pass" }
let multiData = {};   // { itemName: { appearance: X, personality: X, ... } }

async function loadItems() {
    const res = await fetch("data.json");
    items = await res.json();
}

/* -------------------- PAGE BUILDER -------------------- */

function showSmashItem() {
    if (index >= items.length) return showSmashResults();

    const i = items[index];

    game.innerHTML = `
        <div class="item-card">
            ${i.image ? `<img src="${i.image}">` : ""}
            <h2>${i.name}</h2>

            <div class="action-buttons">
                <button onclick="doSmash('smash')">Smash</button>
                <button class="pass" onclick="doSmash('pass')">Pass</button>
            </div>
        </div>
    `;
}

function showMultiItem() {
    if (index >= items.length) return showMultiResults();

    const i = items[index];

    game.innerHTML = `
        <div class="item-card">
            ${i.image ? `<img src="${i.image}">` : ""}
            <h2>${i.name}</h2>

            ${makeSlider("Appearance")}
            ${makeSlider("Personality")}
            ${makeSlider("Buns")}
            ${makeSlider("Cherrys")}
            ${makeSlider("Happy")}

            <button class="download-btn" onclick="saveMulti()">Next</button>
        </div>
    `;
}

function makeSlider(cat) {
    return `
        <div class="slider-container">
            <label>${cat}:</label>
            <input type="range" id="s_${cat}" min="1" max="10" value="5">
        </div>
    `;
}

/* -------------------- SMASH MODE -------------------- */

function doSmash(choice) {
    smashData[items[index].name] = choice;
    index++;
    showSmashItem();
}

function showSmashResults() {
    // calculate stats
    let results = items.map(i => {
        let c = smashData[i.name];
        return {
            name: i.name,
            smash: c === "smash" ? 1 : 0
        };
    });

    let total = results.length;
    let smashCount = results.filter(r => r.smash === 1).length;
    let passCount = total - smashCount;

    // ranking
    results.sort((a, b) => b.smash - a.smash);

    game.innerHTML = `
        <h2>Smash or Pass Results</h2>

        <div class="result-box">
            <p>Total Items: ${total}</p>
            <p>Smash %: ${(smashCount / total * 100).toFixed(1)}%</p>
            <p>Pass %: ${(passCount / total * 100).toFixed(1)}%</p>
        </div>

        <h3>Ranking</h3>
        ${results.map(r => `
            <div class="result-box">${r.name} — ${r.smash ? "Smash" : "Pass"}</div>
        `).join("")}

        <button class="download-btn" onclick='downloadJSON(smashData, "smash_results.json")'>
            Download Results JSON
        </button>

        <canvas id="smashChart" style="margin-top:30px;"></canvas>
    `;

    setTimeout(drawSmashChart, 200);
}

function drawSmashChart() {
    let ctx = document.getElementById("smashChart");
    let labels = items.map(i => i.name);
    let data = items.map(i => smashData[i.name] === "smash" ? 1 : 0);

    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Smash = 1, Pass = 0",
                data
            }]
        }
    });
}

/* -------------------- MULTI MODE -------------------- */

function saveMulti() {
    let name = items[index].name;

    multiData[name] = {
        appearance: +document.getElementById("s_Appearance").value,
        personality: +document.getElementById("s_Personality").value,
        buns: +document.getElementById("s_Buns").value,
        cherrys: +document.getElementById("s_Cherrys").value,
        happy: +document.getElementById("s_Happy").value
    };

    index++;
    showMultiItem();
}

function showMultiResults() {
    let results = Object.entries(multiData).map(([name, scores]) => {
        let total =
            scores.appearance +
            scores.personality +
            scores.buns +
            scores.cherrys +
            scores.happy;

        return { name, total, ...scores };
    });

    results.sort((a, b) => b.total - a.total);

    game.innerHTML = `
        <h2>Multi-Category Results</h2>

        <h3>Averages</h3>
        <div class="result-box">
            Appearance: ${avg(results.map(r => r.appearance))}<br>
            Personality: ${avg(results.map(r => r.personality))}<br>
            Buns: ${avg(results.map(r => r.buns))}<br>
            Cherrys: ${avg(results.map(r => r.cherrys))}<br>
            Happy: ${avg(results.map(r => r.happy))}
        </div>

        <h3>Ranking</h3>
        ${results.map(r => `
            <div class="result-box">
                <strong>${r.name}</strong><br>
                Total Score: ${r.total}
            </div>
        `).join("")}

        <button class="download-btn" onclick='downloadJSON(multiData, "multi_results.json")'>
            Download Results JSON
        </button>

        <canvas id="multiChart" style="margin-top:40px;"></canvas>
    `;

    setTimeout(drawMultiChart, 200);
}

function drawMultiChart() {
    let ctx = document.getElementById("multiChart");

    let labels = Object.keys(multiData);
    let totals = labels.map(name => {
        let s = multiData[name];
        return s.appearance + s.personality + s.buns + s.cherrys + s.happy;
    });

    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Total Score",
                data: totals
            }]
        }
    });
}

function avg(arr) {
    let n = arr.length;
    return (arr.reduce((a, b) => a + b, 0) / n).toFixed(1);
}

/* -------------------- UTIL -------------------- */

function downloadJSON(obj, filename) {
    let blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}

/* -------------------- MODE SWITCHING -------------------- */

document.getElementById("modeSmash").onclick = () => {
    index = 0;
    smashData = {};
    showSmashItem();
};

document.getElementById("modeMulti").onclick = () => {
    index = 0;
    multiData = {};
    showMultiItem();
};

loadItems();
