// Pali tek kad se stranica učita
document.addEventListener('DOMContentLoaded', () => {
  // ----- TABOVI (Info, Raspored, Rezultati...) -----
  const tabs = document.querySelectorAll('.tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // ----- GENERACIJE / TIMOVI -----
  const genPills = document.querySelectorAll('.gen-pill');
  const box = document.getElementById('gen-teams-box');
  const title = document.getElementById('gen-teams-title');
  const list = document.getElementById('gen-teams-list');

  // OVDJE MIJENJAŠ LISTU EKIPA PO GODIŠTU
  const teamsByGen = {
    2015: [
      'Dadeks 1',
      'Dadeks 2',
      'FK Budućnost',
      'OFK Titograd'
    ],
    2016: [
      'Dadeks 2016',
      'FK Budućnost 2016'
    ],
    2017: [
      'Dadeks 2017',
      'FK Budućnost 2017'
    ],
    2018: [
      'Dadeks 2018',
      'FK Budućnost 2018'
    ]
  };

  genPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const year = pill.dataset.gen;

      // aktivna boja za izabranu generaciju
      genPills.forEach(p => p.classList.remove('gen-pill-active'));
      pill.classList.add('gen-pill-active');

      const teams = teamsByGen[year] || [];

      title.textContent = `Ekipe generacije ${year}`;
      if (teams.length === 0) {
        list.innerHTML = '<li>Još nijedna ekipa nije unesena za ovo godište.</li>';
      } else {
        list.innerHTML = teams.map(t => `<li>${t}</li>`).join('');
      }
    });
  });
});
let ALL_MATCHES = [];

async function loadMatches() {
  const res = await fetch("matches.json?v=" + Date.now());
  ALL_MATCHES = await res.json();
}

// Izvuci sve ekipe iz GROUPS_DATA
function getAllTeamsFromGroups() {
  const set = new Set();
  Object.values(GROUPS_DATA).forEach(yearObj => {
    Object.values(yearObj).forEach(teams => teams.forEach(t => set.add(t)));
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function fillTeamFilter() {
  const sel = document.getElementById("filterTeam");
  const teams = getAllTeamsFromGroups();
  sel.innerHTML = `<option value="">— sve ekipe —</option>` + teams.map(t =>
    `<option value="${t}">${t}</option>`
  ).join("");

  sel.addEventListener("change", () => renderSchedule(sel.value));
}

function renderSchedule(teamFilter = "") {
  const box = document.getElementById("scheduleList");
  if (!box) return;

  let list = [...ALL_MATCHES];

  if (teamFilter) {
    list = list.filter(m => m.domacin === teamFilter || m.gost === teamFilter);
  }

  // Sort (ako ima datum/vrijeme)
  list.sort((a,b) => {
    const da = (a.datum || "") + " " + (a.vrijeme || "");
    const db = (b.datum || "") + " " + (b.vrijeme || "");
    return da.localeCompare(db);
  });

  if (!list.length) {
    box.innerHTML = `<p class="hint">Nema utakmica za izabrani filter.</p>`;
    return;
  }

  box.innerHTML = list.map((m, i) => {
    const vrijeme = m.vrijeme || "—";
    const teren = m.teren || "—";
    const datum = m.datum || "";
    const score = (Number.isFinite(m.golDom) && Number.isFinite(m.golGost)) ? `${m.golDom}:${m.golGost}` : "-";

    // kartica kao dugme (lak klik na mob)
    return `
      <button class="btn-secondary" style="width:100%; text-align:left; margin:6px 0;"
        data-idx="${i}">
        <strong>${m.domacin}</strong> – <strong>${m.gost}</strong>
        <span class="hint" style="float:right;">${score}</span><br/>
        <span class="hint">${datum ? datum + " • " : ""}Godište ${m.godiste} • Grupa ${m.grupa} • ${vrijeme} • ${teren}</span>
      </button>
    `;
  }).join("");

  // klik handler
  [...box.querySelectorAll("button[data-idx]")].forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-idx"));
      // POZOR: idx je u trenutnom prikazu, zato izvuci opet iz trenutno filtrirane liste
      const current = (teamFilter ? ALL_MATCHES.filter(m => m.domacin === teamFilter || m.gost === teamFilter) : [...ALL_MATCHES])
        .sort((a,b) => (((a.datum||"")+" "+(a.vrijeme||"")).localeCompare((b.datum||"")+" "+(b.vrijeme||""))));

      openModal(current[idx]);
    });
  });
}

function openModal(m) {
  const modal = document.getElementById("matchModal");
  const title = document.getElementById("modalTitle");
  const body = document.getElementById("modalBody");

  const vrijeme = m.vrijeme || "—";
  const teren = m.teren || "—";
  const datum = m.datum || "—";
  const score = (Number.isFinite(m.golDom) && Number.isFinite(m.golGost)) ? `${m.golDom}:${m.golGost}` : "-";

  title.textContent = `${m.domacin} – ${m.gost}`;

  body.innerHTML = `
    <div style="padding:10px; border:1px solid #1f2937; border-radius:12px; background:#020617;">
      <div><strong>Godište:</strong> ${m.godiste}</div>
      <div><strong>Grupa:</strong> ${m.grupa}</div>
      <div><strong>Datum:</strong> ${datum}</div>
      <div><strong>Vrijeme:</strong> ${vrijeme}</div>
      <div><strong>Teren:</strong> ${teren}</div>
      <div><strong>Rezultat:</strong> ${score}</div>
    </div>
  `;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("matchModal").style.display = "none";
}

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("matchModal").addEventListener("click", (e) => {
  if (e.target.id === "matchModal") closeModal();
});

// INIT
(async function initSchedule() {
  await loadMatches();
  fillTeamFilter();
  renderSchedule("");
})();
let ALL_MATCHES = [];

async function loadMatches() {
  const res = await fetch("matches.json?v=" + Date.now());
  ALL_MATCHES = await res.json();
}

// Izvući sve timove koji se pojavljuju u matches.json
function getTeamsFromMatches() {
  const set = new Set();
  ALL_MATCHES.forEach(m => {
    if (m.domacin) set.add(m.domacin);
    if (m.gost) set.add(m.gost);
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function fillTeamFilter() {
  const sel = document.getElementById("filterTeam");
  const teams = getTeamsFromMatches();
  sel.innerHTML = `<option value="">— sve ekipe —</option>` + teams.map(t =>
    `<option value="${t}">${t}</option>`
  ).join("");

  sel.addEventListener("change", () => renderSchedule(sel.value));
}

function renderSchedule(teamFilter = "") {
  const box = document.getElementById("scheduleList");
  if (!box) return;

  let list = [...ALL_MATCHES];

  if (teamFilter) {
    list = list.filter(m => m.domacin === teamFilter || m.gost === teamFilter);
  }

  // Sort stabilan: po godistu, pa po grupi, pa po domacinu
  list.sort((a,b) => {
    const A = `${a.godiste||""}-${a.grupa||""}-${a.domacin||""}-${a.gost||""}`;
    const B = `${b.godiste||""}-${b.grupa||""}-${b.domacin||""}-${b.gost||""}`;
    return A.localeCompare(B);
  });

  if (!list.length) {
    box.innerHTML = `<p class="hint">Nema utakmica za izabrani filter.</p>`;
    return;
  }

  box.innerHTML = list.map((m, i) => {
    const score = `${m.golDom}:${m.golGost}`;
    return `
      <button class="btn-secondary" style="width:100%; text-align:left; margin:6px 0;"
        data-idx="${i}">
        <strong>${m.domacin}</strong> – <strong>${m.gost}</strong>
        <span class="hint" style="float:right;">${score}</span><br/>
        <span class="hint">Godište ${m.godiste} • Grupa ${m.grupa}</span>
      </button>
    `;
  }).join("");

  // Klik na utakmicu
  [...box.querySelectorAll("button[data-idx]")].forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-idx"));
      openModal(list[idx]); // BITNO: otvaramo iz "list" koja je filtrirana
    });
  });
}

function openModal(m) {
  const modal = document.getElementById("matchModal");
  const title = document.getElementById("modalTitle");
  const body = document.getElementById("modalBody");

  title.textContent = `${m.domacin} – ${m.gost}`;

  body.innerHTML = `
    <div style="padding:10px; border:1px solid #1f2937; border-radius:12px; background:#020617;">
      <div><strong>Godište:</strong> ${m.godiste}</div>
      <div><strong>Grupa:</strong> ${m.grupa}</div>
      <div><strong>Domaćin:</strong> ${m.domacin}</div>
      <div><strong>Gost:</strong> ${m.gost}</div>
      <div style="margin-top:8px;"><strong>Rezultat:</strong> ${m.golDom}:${m.golGost}</div>
    </div>
  `;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("matchModal").style.display = "none";
}

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("matchModal").addEventListener("click", (e) => {
  if (e.target.id === "matchModal") closeModal();
});

// INIT
(async function initSchedule() {
  await loadMatches();
  fillTeamFilter();
  renderSchedule("");
})();


