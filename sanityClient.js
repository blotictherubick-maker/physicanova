import { createClient } from 'https://esm.sh/@sanity/client@6.15.0';
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url@1.0.2';
import { toHTML } from 'https://esm.sh/@portabletext/to-html@2.0.0';

// Sanity Client Kurulumu
export const sanityClient = createClient({
  projectId: '3778qog4', // TODO: panelden alınacak ID
  dataset: 'production',
  useCdn: true, // Production için hızlı CDN okuması
  apiVersion: '2024-03-24', // Güncel tarih
});

const builder = imageUrlBuilder(sanityClient);

// Görsel URL oluşturucu
export function urlFor(source) {
  if (!source) return null;
  return builder.image(source);
}

// XSS Koruması (HTML Escape)
export function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Portable Text to HTML
export function renderPortableText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  // @portabletext/to-html kendi içinde XSS safe bir encoder barındırır
  return toHTML(blocks, {
    components: {
      types: {
        image: ({ value }) => {
          const imgUrl = urlFor(value)?.url();
          if (!imgUrl) return '';
          const altText = escapeHTML(value.alt || 'Görsel');
          return `<img src="${imgUrl}" alt="${altText}" class="my-6 rounded-xl w-full max-h-[500px] object-cover border border-border-dark shadow-md" loading="lazy" />`;
        }
      }
    }
  });
}

// Güvenli YouTube embed URL
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  // Sadece güvenilir youtube formatlarını parse et
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  if (match && match[1].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`; // Privacy-enhanced mod ve rel=0 (önerilen videolar izole)
  }
  return null;
}
