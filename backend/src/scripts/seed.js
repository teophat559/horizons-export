import { db, initDb } from '../services/db.js';

await initDb();

const contests = [
  { name: 'Hoa Khôi 2025', description: 'Cuộc thi sắc đẹp toàn quốc', banner_url: 'https://images.unsplash.com/photo-1520975916090-3105956dac38' },
  { name: 'Giọng Hát Vàng', description: 'Tìm kiếm tài năng âm nhạc', banner_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91' },
];

for (const c of contests) {
  if (db.isMemory) {
    const row = db.memAddContest(c);
    for (let i = 1; i <= 4; i++) {
      db.memAddContestant({
        name: `${c.name} - Thí sinh ${i}`,
        image_url: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d',
        total_votes: Math.floor(Math.random() * 2500),
        contest_id: row.id,
      });
    }
  } else {
    const row = await db.one('INSERT INTO contests(name, description, banner_url) VALUES($1,$2,$3) RETURNING id', [c.name, c.description, c.banner_url]);
    for (let i = 1; i <= 4; i++) {
      await db.none('INSERT INTO contestants(name, image_url, total_votes, contest_id) VALUES($1,$2,$3,$4)', [
        `${c.name} - Thí sinh ${i}`,
        'https://images.unsplash.com/photo-1544006659-f0b21884ce1d',
        Math.floor(Math.random() * 2500),
        row.id,
      ]);
    }
  }
}

console.log('Seeded');
