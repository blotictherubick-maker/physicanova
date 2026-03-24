import { sanityClient, urlFor, escapeHTML, getYouTubeThumbnailUrl } from './sanityClient.js';

const categoryStyles = {
  'Güncelleme': 'bg-black/5 text-ink border-border-soft',
  'Yeni İçerik': 'bg-black/5 text-ink border-border-soft',
  'Duyuru': 'bg-black/5 text-ink border-border-soft',
  'Haber': 'bg-black/5 text-ink border-border-soft',
  'Video': 'bg-black/5 text-ink border-border-soft',
  'Blog': 'bg-black/5 text-ink border-border-soft',
};

let allPosts = [];
let visibleCount = 9;

async function fetchNews() {
  const container = document.getElementById('news-container');
  // Draftları (<id> "drafts." ile başlar) ve isPublished=false olanları hariç tutar
  const query = `*[_type == "newsPost" && isPublished == true && !(_id in path("drafts.**"))] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    category,
    featured,
    coverImage,
    youtubeUrl
  }`;

  try {
    allPosts = await sanityClient.fetch(query);
    renderNews();
  } catch (error) {
    console.error("Haberler çekilirken hata oluştu:", error);
    container.innerHTML = `
      <div class="text-center p-8 bg-paper rounded border border-accent/30 shadow-sm md:col-span-2 lg:col-span-3">
        <span class="material-symbols-outlined text-4xl text-accent mb-3 block">error</span>
        <h3 class="text-xl font-bold text-ink mb-2">Bağlantı Hatası</h3>
        <p class="text-ink-light mb-4">Haberler sunucudan yüklenirken geçici bir sorun oluştu. Lütfen sayfayı yenileyiniz.</p>
        <button onclick="window.location.reload()" class="px-4 py-2 bg-surface hover:bg-white text-ink rounded border border-border-soft transition-colors text-sm font-medium">
          Sayfayı Yenile
        </button>
      </div>
    `;
  }
}

function renderNews() {
  const container = document.getElementById('news-container');
  const loadMoreBtnContainer = document.getElementById('load-more-container');
  
  if (!allPosts || allPosts.length === 0) {
    container.innerHTML = `
      <div class="text-center p-12 bg-surface rounded border border-border-soft shadow-sm md:col-span-2 lg:col-span-3">
        <span class="material-symbols-outlined text-4xl text-ink-light mb-3 block opacity-50">article</span>
        <p class="text-ink text-lg font-medium">Şu anda yayınlanmış aktif bir haber bulunmuyor.</p>
        <p class="text-ink-light text-sm mt-2">Lütfen daha sonra tekrar kontrol edin.</p>
      </div>
    `;
    if (loadMoreBtnContainer) loadMoreBtnContainer.style.display = 'none';
    return;
  }

  const postsToShow = allPosts.slice(0, visibleCount);

  const html = postsToShow.map(post => {
    // Güvenli veriler
    const safeTitle = escapeHTML(post.title);
    const safeExcerpt = escapeHTML(post.excerpt || '');
    const safeCategory = escapeHTML(post.category);
    const safeSlug = escapeHTML(post.slug);

    const date = new Date(post.publishedAt).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    
    const style = categoryStyles[safeCategory] || 'bg-black/5 text-ink-light border-border-soft';
    
    // Fallback Image or Youtube Thumbnail
    let imageHtml;
    const imgUrl = post.coverImage ? urlFor(post.coverImage).width(800).height(400).url() : null;
    const ytThumbUrl = post.youtubeUrl ? getYouTubeThumbnailUrl(post.youtubeUrl) : null;
    
    if (imgUrl) {
      imageHtml = `<img src="${imgUrl}" alt="${safeTitle}" loading="lazy" class="w-full aspect-[2/1] object-cover rounded mb-4 border border-border-soft">`;
    } else if (ytThumbUrl) {
       imageHtml = `
       <div class="relative w-full aspect-[2/1] mb-4 rounded overflow-hidden group border border-border-soft block">
         <img src="${ytThumbUrl}" alt="${safeTitle}" loading="lazy" class="w-full h-full object-cover">
         <div class="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/5 transition-colors">
            <span class="material-symbols-outlined text-white text-5xl opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-md">play_circle</span>
         </div>
       </div>`;
    } else {
      imageHtml = `<div class="w-full aspect-[2/1] bg-surface border border-border-soft rounded mb-4 flex items-center justify-center">
        <span class="material-symbols-outlined text-5xl text-ink-light opacity-30">image</span>
      </div>`;
    }

    const featuredClass = post.featured ? 'md:col-span-2 lg:col-span-2 ring-1 ring-primary/40 bg-surface shadow-academic relative overflow-hidden' : 'bg-surface';
    const featuredBadge = post.featured ? `
      <div class="absolute top-0 right-0 z-10">
        <div class="bg-primary text-white text-[10px] font-bold px-8 py-1 rotate-45 translate-x-[30%] translate-y-[50%] shadow-sm">ÖNE ÇIKAN</div>
      </div>
    ` : '';

    return `
      <article class="${featuredClass} border border-border-soft rounded p-6 hover:shadow-academic hover:-translate-y-1 transition-all duration-300 flex flex-col">
          ${featuredBadge}
          <a href="haber.html?slug=${safeSlug}" class="block">
            ${imageHtml}
          </a>
          <div class="flex flex-wrap items-center gap-2 mb-4">
              <span class="${style} text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm border">${safeCategory}</span>
              <time class="text-ink-light text-xs font-medium flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                ${date}
              </time>
          </div>
          <h2 class="text-xl font-bold text-ink mb-3 cursor-pointer hover:text-primary transition-colors font-display tracking-tight leading-tight">
              <a href="haber.html?slug=${safeSlug}">${safeTitle}</a>
          </h2>
          <p class="text-ink-light text-sm leading-relaxed mb-6 line-clamp-3">
              ${safeExcerpt}
          </p>
          <div class="mt-auto pt-4 border-t border-border-soft">
              <a href="haber.html?slug=${safeSlug}"
                  class="inline-flex items-center gap-2 text-ink font-semibold text-sm hover:text-primary transition-colors group">
                  Devamını Oku
                  <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
          </div>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
  
  if (visibleCount < allPosts.length) {
    if (loadMoreBtnContainer) loadMoreBtnContainer.style.display = 'block';
  } else {
    if (loadMoreBtnContainer) loadMoreBtnContainer.style.display = 'none';
  }
}

function loadMore() {
  visibleCount += 9;
  renderNews();
}

document.addEventListener('DOMContentLoaded', () => {
  fetchNews();
  const btn = document.getElementById('load-more-btn');
  if (btn) btn.addEventListener('click', loadMore);
});
