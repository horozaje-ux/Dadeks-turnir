// ===============================
// INIT kad se stranica učita
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupGenerations();
  await initSchedule(); // matches.json + filter + lista + modal
});

// ===============================
// TABOVI
// ===============================
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".tab-content");
  if (!tabs.length || !sections.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.tab;
      if (!targetId) return;

      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      tab.classList.add("active");

      const target = document.getElementById(targetId);
      if (target) target.classList.add("active");
    });
  });
}

// ===============================
// GENERACIJE / TIMOVI
// ===============================
function setupGenerations() {
  const genPills = document.querySelectorAll(".gen-pill");
  const title = document.getElementById("gen-teams-title");
  const list = document.getElementById("gen-teams-list");

  // Ako ova sekcija ne postoji na stranici, samo preskoči
  if (!genPills.length || !title || !list) return;

  const teamsByGen = {
    2015: ["Dadeks 1", "Dadeks 2", "FK Budućnost", "OFK Titograd"],
    2016: ["Dadeks 2016", "FK Budućnost 2016"],
    2017: ["Dadeks 2017", "FK Budućnost 2017"],
    2018: ["Dadeks 2018", "FK Budućnost 2018"],
  };

  genPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const year = pill.dataset.gen;

      genPills.forEach((p) => p.classList.remove("gen-pill-active"));
      pill.classList.add("gen-pill-active");

      const teams = teamsByGen[year] || [];
      title.textContent = `Ekipe generacije ${year}`;

      list.innerHTML = teams.length
        ? teams.map((t) => `<li>${t}</li>`).join("")
        : "<li>Još nijedna ekipa nije unesena za ovo godište.</li>";
    });
  });
}

// ===============================
// RASPORED / MODAL / FILTER
// ===============================
let ALL_MATCHES = [];

async function loadMatches() {
  try {
    const res = await fetch("matches.json?v=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    ALL_MATCHES = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Greška pri učitavanju matches.json:", e);
    ALL_MATCHES = [];
  }
}

// Izvući timove iz matches.json (najtačnije)
function getTeamsFromMatches() {
  const set = new Set();
  ALL_MATCHES.forEach((m) => {
    if (m.domacin) set.add(String(m.domacin).trim());
    if (m.gost) set.add(String(m.gost).trim());
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "sr"));
}

function fillTeamFilter() {
  const sel = document.getElementById("filterTeam");
  if (!sel) return;

  const teams = getTeamsFromMatches();
  sel.innerHTML =
    `<option value="">— sve ekipe —</option>` +
    teams.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");

  sel.addEventListener("change", () => renderSchedule(sel.value));
}

function renderSchedule(teamFilter = "") {
  const box = document.getElementById("scheduleList");
  if (!box) return;

  let list = [...ALL_MATCHES];

  if (teamFilter) {
    list = list.filter((m) => m.domacin === teamFilter || m.gost === teamFilter);
  }

  // sort: ako ima datum/vrijeme -> po tome, inače stabilno
  list.sort((a, b) => {
    const da = `${a.datum || ""} ${a.vrijeme || ""}`.trim();
    const db = `${b.datum || ""} ${b.vrijeme || ""}`.trim();
    if (da || db) return da.localeCompare(db);
    const A = `${a.godiste || ""}-${a.grupa || ""}-${a.domacin || ""}-${a.gost || ""}`;
    const B = `${b.godiste || ""}-${b.grupa || ""}-${b.domacin || ""}-${b.gost || ""}`;
    return A.localeCompare(B);
  });

  if (!list.length) {
    box.innerHTML = `<p class="hint">Nema utakmica za izabrani filter.</p>`;
    return;
  }

  box.innerHTML = list
    .map((m, i) => {
      const score =
        isNumber(m.golDom) && isNumber(m.golGost) ? `${m.golDom}:${m.golGost}` : "-";
      const vrijeme = m.vrijeme || "—";
      const teren = m.teren || "—";
      const datum = m.datum || "";

      return `
        <button class="btn-secondary" style="width:100%; text-align:left; margin:6px 0;"
          data-idx="${i}">
          <strong>${escapeHtml(m.domacin || "")}</strong> – <strong>${escapeHtml(m.gost || "")}</strong>
          <span class="hint" style="float:right;">${escapeHtml(score)}</span><br/>
          <span class="hint">
            ${datum ? escapeHtml(datum) + " • " : ""}
            Godište ${escapeHtml(String(m.godiste || ""))} • Grupa ${escapeHtml(String(m.grupa || ""))} •
            ${escapeHtml(vrijeme)} • ${escapeHtml(teren)}
          </span>
        </button>
      `;
    })
    .join("");

  // Klik na utakmicu -> modal (BITNO: koristi "list" koja je već filtrirana/sortirana)
  box.querySelectorAll("button[data-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-idx"));
      openModal(list[idx]);
    });
  });
}

function openModal(m) {
  if (!m) return;

  const modal = document.getElementById("matchModal");
  const title = document.getElementById("modalTitle");
  const body = document.getElementById("modalBody");
  if (!modal || !title || !body) return;

  const score =
    isNumber(m.golDom) && isNumber(m.golGost) ? `${m.golDom}:${m.golGost}` : "-";

  title.textContent = `${m.domacin || ""} – ${m.gost || ""}`;

  body.innerHTML = `
    <div style="padding:10px; border:1px solid #1f2937; border-radius:12px; background:#020617;">
      <div><strong>Godište:</strong> ${escapeHtml(String(m.godiste || "—"))}</div>
      <div><strong>Grupa:</strong> ${escapeHtml(String(m.grupa || "—"))}</div>
      <div><strong>Datum:</strong> ${escapeHtml(String(m.datum || "—"))}</div>
      <div><strong>Vrijeme:</strong> ${escapeHtml(String(m.vrijeme || "—"))}</div>
      <div><strong>Teren:</strong> ${escapeHtml(String(m.teren || "—"))}</div>
      <div><strong>Rezultat:</strong> ${escapeHtml(score)}</div>
    </div>
  `;

  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("matchModal");
  if (modal) modal.style.display = "none";
}

async function initSchedule() {
  // Ako nema schedule sekcije na toj stranici, ne radi ništa
  if (!document.getElementById("scheduleList")) return;

  await loadMatches();
  fillTeamFilter();
  renderSchedule("");

  // modal close handlers (samo ako postoje elementi)
  const closeBtn = document.getElementById("closeModal");
  const modal = document.getElementById("matchModal");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target && e.target.id === "matchModal") closeModal();
    });
  }
}

// ===============================
// HELPERS
// ===============================
function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
