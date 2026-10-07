// Главная: каталог мастерских строится из таблицы workshops
const workshopList = document.getElementById('workshops');

async function loadWorkshops() {
  const workshops = await api('/api/workshops');
  if (!Array.isArray(workshops)) {
    document.getElementById('catalog-error').hidden = false;
    return;
  }
  workshopList.innerHTML = workshops.map(workshopCard).join('');
}

// Карточка: фото, название, описание и переход к заявке с уже выбранной мастерской.
// Каталог ниже первого экрана, поэтому фото грузятся отложенно (loading="lazy")
function workshopCard(workshop) {
  return `
    <div class="col reveal">
      <article class="workshop-card">
        <div class="workshop-photo">
          <img src="/${escapeHtml(workshop.image)}" alt="${escapeHtml(workshop.name)}" width="640" height="360" loading="lazy">
        </div>
        <div class="workshop-body">
          <h3>${escapeHtml(workshop.name)}</h3>
          <p>${escapeHtml(workshop.description)}</p>
          <a class="btn-line btn-sm stretched-link" href="/application?workshop=${workshop.id}">Записаться</a>
        </div>
      </article>
    </div>`;
}

loadWorkshops();
