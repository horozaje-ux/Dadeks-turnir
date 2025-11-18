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
