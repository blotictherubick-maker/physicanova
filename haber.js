import { sanityClient, urlFor, renderPortableText, getYouTubeEmbedUrl, escapeHTML } from './sanityClient.js';

const categoryStyles = {
  'Güncelleme': 'bg-black/5 text-ink border-border-soft',
  'Yeni İçerik': 'bg-black/5 text-ink border-border-soft',
  'Duyuru': 'bg-black/5 text-ink border-border-soft',
  'Haber': 'bg-black/5 text-ink border-border-soft',
  'Video': 'bg-black/5 text-ink border-border-soft',
  'Blog': 'bg-black/5 text-ink border-border-soft',
};

async function fetchNewsDetail() {
  const container = document.getElementById('news-detail-container');
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    showError("Sayfa Bulunamadı", "Aradığınız habere ulaşılamıyor (Eksik veya hatalı bağlantı).", true);
    return;
  }

  // Sadece yayında olan ve draft olmayan
  const query = `*[_type == "newsPost" && slug.current == $slug && isPublished == true && !(_id in path("drafts.**"))][0] {
    title,
    publishedAt,
    category,
    coverImage,
    youtubeUrl,
    body,
    seoTitle,
    seoDescription
  }`;

  try {
    const post = await sanityClient.fetch(query, { slug });
    if (!post) {
      showError("404 - İçerik Bulunamadı", "Aradığınız içerik yayından kaldırılmış, taşınmış veya hiç var olmamış olabilir.", true);
      return;
    }
    renderDetail(post);
  } catch (error) {
    console.error("Detay çekilirken hata:", error);
    showError("Bağlantı Hatası", "Haber detayları yüklenirken sunucu ile iletişim kurulamadı. Lütfen içerik engelleyici uzantılarınızı devre dışı bırakıp tekrar deneyin veya sayfayı yenileyin.");
  }
}

function showError(title, message, is404 = false) {
  document.getElementById('news-detail-container').innerHTML = `
    <div class="text-center p-12 bg-surface rounded border border-border-soft flex flex-col items-center justify-center min-h-[40vh]">
      <span class="material-symbols-outlined text-[80px] ${is404 ? 'text-primary/50' : 'text-accent/50'} mb-6">
        ${is404 ? 'search_off' : 'cloud_off'}
      </span>
      <h1 class="text-2xl md:text-3xl font-display font-bold text-ink mb-4 tracking-tight">${escapeHTML(title)}</h1>
      <p class="text-ink-light max-w-md mx-auto mb-8">${escapeHTML(message)}</p>
      
      <div class="flex gap-4">
        <a href="haberler.html" class="inline-flex items-center gap-2 px-6 py-3 bg-paper text-ink font-medium rounded border border-border-soft hover:border-primary/50 hover:text-primary transition-all shadow-sm">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Haberlere Dön
        </a>
        ${!is404 ? `<button onclick="window.location.reload()" class="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border-soft text-ink font-medium rounded hover:bg-white transition-colors shadow-sm"><span class="material-symbols-outlined text-sm">refresh</span> Yenile</button>` : ''}
      </div>
    </div>
  `;
}

function renderDetail(post) {
  const container = document.getElementById('news-detail-container');
  
  const safeTitle = escapeHTML(post.title);
  const safeTitleForSEO = escapeHTML(post.seoTitle || post.title);
  const safeDescForSEO = escapeHTML(post.seoDescription || safeTitleForSEO);
  const safeCategory = escapeHTML(post.category);

  // SEO Fallbacks - Güvenli başlık ve tanım eklendi
  document.title = `${safeTitleForSEO} - PhysicaNova`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
  }
  metaDesc.content = safeDescForSEO;

  const date = new Date(post.publishedAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  
  const style = categoryStyles[safeCategory] || 'bg-black/5 text-ink-light border-border-soft';

  // Görsel Fallback
  let imageHtml = '';
  const imgUrl = urlFor(post.coverImage)?.width(1200).height(600).url();
  if (imgUrl) {
      imageHtml = `<figure class="mb-8 overflow-hidden rounded border border-border-soft shadow-sm bg-surface">
          <img src="${imgUrl}" alt="${safeTitle}" class="w-full h-auto max-h-[500px] object-cover transition-transform duration-700">
      </figure>`;
  }

  // Güvenli YouTube render
  let videoHtml = '';
  if (post.youtubeUrl) {
      const embedUrl = getYouTubeEmbedUrl(post.youtubeUrl);
      if (embedUrl) {
          videoHtml = `
            <div class="relative w-full pb-[56.25%] mb-10 rounded overflow-hidden border border-border-soft shadow-sm bg-black">
                <iframe class="absolute top-0 left-0 w-full h-full" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          `;
      }
  }

  const bodyHtml = renderPortableText(post.body);

  container.innerHTML = `
      ${imageHtml}
      
      <div class="flex flex-wrap items-center gap-4 mb-6">
          <span class="${style} text-xs tracking-wider uppercase font-bold px-3 py-1 rounded-sm border">${safeCategory}</span>
          <time class="text-ink-light text-sm font-medium flex items-center gap-1.5" datetime="${post.publishedAt}">
            <span class="material-symbols-outlined text-[16px]">calendar_month</span>
            ${date}
          </time>
      </div>

      <h1 class="text-3xl md:text-5xl font-bold font-display text-ink mb-8 leading-tight tracking-tight">
          ${safeTitle}
      </h1>

      ${videoHtml}

      <div class="portable-text text-lg pb-12">
          ${bodyHtml || '<div class="p-6 bg-surface rounded border border-border-soft text-ink-light italic text-center">Bu haber için metin içeriği girilmemiş.</div>'}
      </div>
  `;
}

document.addEventListener('DOMContentLoaded', fetchNewsDetail);
