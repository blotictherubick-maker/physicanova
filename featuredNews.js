import { sanityClient, urlFor, escapeHTML } from './sanityClient.js';

async function fetchFeaturedNews() {
  const container = document.getElementById('featured-news-widget');
  if (!container) return;

  // Sadece son 3 öne çıkan haberi al
  const query = `*[_type == "newsPost" && isPublished == true && featured == true && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...3] {
    title,
    "slug": slug.current,
    publishedAt,
    category
  }`;

  try {
    const posts = await sanityClient.fetch(query);
    renderFeaturedWidget(posts, container);
  } catch (error) {
    console.error("Öne çıkan haberler çekilirken hata oluştu:", error);
    // Hata durumunda widget'ı gizle
    container.style.display = 'none';
  }
}

function renderFeaturedWidget(posts, container) {
  if (!posts || posts.length === 0) {
    container.style.display = 'none';
    return;
  }

  const html = posts.map(post => {
    const safeTitle = escapeHTML(post.title);
    const safeSlug = escapeHTML(post.slug);
    const safeCategory = escapeHTML(post.category);
    
    const date = new Date(post.publishedAt).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short'
    });

    return `
      <a href="haber.html?slug=${safeSlug}" class="group block p-4 rounded-xl border border-border-dark bg-card-dark hover:bg-[#1a1c26] hover:border-primary/50 transition-all">
        <div class="flex items-center gap-2 mb-2">
            <span class="text-[10px] font-bold text-primary uppercase tracking-wider">${safeCategory}</span>
            <span class="w-1 h-1 rounded-full bg-text-secondary"></span>
            <time class="text-xs text-text-secondary">${date}</time>
        </div>
        <h4 class="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-2">${safeTitle}</h4>
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <span class="material-symbols-outlined text-yellow-400 text-xl">star</span>
        Öne Çıkan Gelişmeler
      </h3>
      <a href="haberler.html" class="text-xs font-semibold text-text-secondary hover:text-white transition-colors">Tümü</a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${html}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchFeaturedNews();
  fetchSidebarNews();
});

async function fetchSidebarNews() {
  const container = document.getElementById('sidebar-news-widget');
  if (!container) return;

  const query = `*[_type == "newsPost" && isPublished == true && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...3] {
    title,
    "slug": slug.current,
    publishedAt
  }`;

  try {
    const posts = await sanityClient.fetch(query);
    renderSidebarWidget(posts, container);
  } catch (error) {
    console.error("Sidebar haberleri çekilirken hata oluştu:", error);
    container.style.display = 'none';
  }
}

function renderSidebarWidget(posts, container) {
  if (!posts || posts.length === 0) {
    container.style.display = 'none';
    return;
  }

  const html = posts.map(post => {
    const safeTitle = escapeHTML(post.title);
    const safeSlug = escapeHTML(post.slug);
    
    const date = new Date(post.publishedAt).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short'
    });

    return `
      <a href="haber.html?slug=${safeSlug}" class="block mb-3 group">
        <time class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">${date}</time>
        <h4 class="text-xs font-semibold text-gray-700 group-hover:text-[#1B4332] transition-colors line-clamp-2 mt-0.5 leading-tight">${safeTitle}</h4>
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <h3 class="font-bold text-[11px] mb-3 uppercase tracking-wider text-gray-500 border-t border-[#DEE2E6] pt-5 mt-2">Son Haberler</h3>
    <div class="flex flex-col">
      ${html}
    </div>
    <a href="haberler.html" class="text-xs font-semibold text-[#1B4332] hover:underline mt-1 inline-block">Tümünü Gör</a>
  `;
}
