// Default categories and content frames for a contestant (web user)
// Non-visual scaffolding: meant for data preparation, not changing UI.

export const DEFAULT_CONTESTANT_CATEGORIES = [
  { id: 'about', title: 'Giới thiệu' },
  { id: 'achievements', title: 'Thành tích' },
  { id: 'gallery', title: 'Hình ảnh' },
  { id: 'video', title: 'Video' },
  { id: 'contact', title: 'Liên hệ' },
];

export function buildContestantSections(contestant = {}) {
  const name = contestant.name || 'Thí sinh';
  const desc = contestant.description || `Xin chào! Mình là ${name}. Rất mong nhận được sự ủng hộ của bạn!`;
  const image = contestant.imageUrl || '';
  // Ảnh mẫu mặc định (200x200) để luôn có thumbnail nếu thiếu ảnh gốc
  const PLACEHOLDER_THUMB = 'https://images.unsplash.com/photo-1541633268-9f9cbf2a5b39?auto=format&fit=crop&w=200&q=60';

  return {
    about: {
      title: 'Giới thiệu',
      content: desc,
    },
    achievements: {
      title: 'Thành tích',
      items: [
        // Ví dụ dữ liệu mẫu (trống nếu chưa có)
      ],
    },
    gallery: {
      title: 'Hình ảnh',
  images: image ? [image] : [PLACEHOLDER_THUMB],
    },
    video: {
      title: 'Video',
      embeds: [
        // Có thể thêm link YouTube/Vimeo sau
      ],
    },
    contact: {
      title: 'Liên hệ',
      links: [
        // Ví dụ: { type: 'facebook', url: '' }
      ],
    },
  };
}

export function attachDefaultSections(list = []) {
  return (Array.isArray(list) ? list : []).map((c) => ({
    ...c,
    categories: DEFAULT_CONTESTANT_CATEGORIES,
    sections: buildContestantSections(c),
  }));
}
