import { sanityClient, urlFor, escapeHTML, getYouTubeThumbnailUrl } from './sanityClient.js';

const categoryStyles = {
  'Güncelleme': 'bg-primary/10 text-primary border-primary/20',
  'Yeni İçerik': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Duyuru': 'bg-primary/10 text-primary border-primary/20',
  'Haber': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Video': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Blog': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

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
    const posts = await sanityClient.fetch(query);
    renderNews(posts);
  } catch (error) {
    console.error("Haberler çekilirken hata oluştu:", error);
    container.innerHTML = `
      <div class="text-center p-8 bg-red-500/10 rounded-xl border border-red-500/20 shadow-lg">
        <span class="material-symbols-outlined text-4xl text-red-400 mb-3 block">error</span>
        <h3 class="text-xl font-bold text-red-400 mb-2">Bağlantı Hatası</h3>
        <p class="text-red-300/80">Haberler sunucudan yüklenirken geçici bir sorun oluştu. Lütfen sayfayı yenileyiniz.</p>
        <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium border border-red-500/30">
          Sayfayı Yenile
        </button>
      </div>
    `;
}

function renderNews(posts) {
  const container = document.getElementById('news-container');
  
  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="text-center p-12 bg-card-dark rounded-xl border border-border-dark shadow-sm">
        <span class="material-symbols-outlined text-4xl text-text-secondary mb-3 block opacity-50">article</span>
        <p class="text-text-secondary text-lg">Şu anda yayınlanmış aktif bir haber bulunmuyor.</p>
        <p class="text-text-secondary/60 text-sm mt-2">Lütfen daha sonra tekrar kontrol edin.</p>
      </div>
    `;
    return;
  }

  const html = posts.map(post => {
    // Güvenli veriler
    const safeTitle = escapeHTML(post.title);
    const safeExcerpt = escapeHTML(post.excerpt || '');
    const safeCategory = escapeHTML(post.category);
    const safeSlug = escapeHTML(post.slug);

    const date = new Date(post.publishedAt).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    
    const style = categoryStyles[safeCategory] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    
    // Fallback Image or Youtube Thumbnail
    let imageHtml;
    const imgUrl = urlFor(post.coverImage)?.width(800).height(400).url();
    const ytThumbUrl = post.youtubeUrl ? getYouTubeThumbnailUrl(post.youtubeUrl) : null;
    
    if (imgUrl) {
      imageHtml = `<img src="${imgUrl}" alt="${safeTitle}" loading="lazy" class="w-full h-48 object-cover rounded-lg mb-4 opacity-80 hover:opacity-100 transition-opacity">`;
    } else if (ytThumbUrl) {
       // Video kapak fotoğrafı ve üzerine Play butonu eklentisi
       imageHtml = `
       <div class="relative w-full h-48 mb-4 opacity-80 hover:opacity-100 transition-opacity rounded-lg overflow-hidden group">
         <img src="${ytThumbUrl}" alt="${safeTitle}" loading="lazy" class="w-full h-full object-cover">
         <div class="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
            <span class="material-symbols-outlined text-white text-5xl">play_circle</span>
         </div>
       </div>`;
    } else {
      imageHtml = `<div class="w-full h-48 bg-background-dark border-2 border-dashed border-border-dark rounded-lg mb-4 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
        <span class="material-symbols-outlined text-5xl text-border-dark">image</span>
      </div>`;
    }

    const featuredClass = post.featured ? 'ring-1 ring-primary/80 shadow-[0_0_20px_rgba(19,55,236,0.15)] relative overflow-hidden' : '';
    const featuredBadge = post.featured ? `
      <div class="absolute top-0 right-0">
        <div class="bg-primary text-white text-[10px] font-bold px-8 py-1 rotate-45 translate-x-[30%] translate-y-[50%] shadow-lg">ÖNE ÇIKAN</div>
      </div>
    ` : '';

    return `
      <article class="bg-card-dark border border-border-dark rounded-xl p-6 hover:border-primary/50 transition-colors shadow-lg ${featuredClass}">
          ${featuredBadge}
          <a href="haber.html?slug=${safeSlug}" class="block">
            ${imageHtml}
          </a>
          <div class="flex items-center gap-4 mb-4">
              <span class="${style} text-xs font-bold px-3 py-1 rounded-full border">${safeCategory}</span>
              <time class="text-text-secondary text-sm font-medium flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">calendar_today</span>
                ${date}
              </time>
          </div>
          <h2 class="text-xl font-bold text-white mb-3 cursor-pointer hover:text-primary transition-colors">
              <a href="haber.html?slug=${safeSlug}">${safeTitle}</a>
          </h2>
          <p class="text-text-secondary leading-relaxed mb-5 line-clamp-3">
              ${safeExcerpt}
          </p>
          <a href="haber.html?slug=${safeSlug}"
              class="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:text-primary-hover transition-colors group">
              Devamını Oku
              <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', fetchNews);
