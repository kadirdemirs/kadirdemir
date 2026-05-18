// Static fallback content. Real content is served from MongoDB via /api/blog and /api/partners.
// The two posts below are launch-day "starter" content so the site never renders an empty Blog page.
// As soon as the admin adds a real post in MongoDB, that post overrides (matching slug) or appends.

export const blogPosts = [
  {
    id: 'starter-1',
    slug: 'merhaba-2026',
    date: '2026-01-12',
    category: 'Günlük',
    categoryEn: 'Journal',
    readTime: 3,
    image: null,
    titleTr: 'Merhaba, 2026 — kanal için yeni dönem',
    titleEn: 'Hello, 2026 — a new chapter for the channel',
    excerptTr:
      'Yeni yılda kanalda neyi değiştiriyorum, hangi formatları deneyeceğim ve neden buralarda yazıyorum.',
    excerptEn:
      'What I’m changing on the channel this year, which formats I want to try, and why I’m writing here at all.',
    contentTr: `<p>Uzun süredir yalnızca video çekiyordum. Bu yıl ek olarak burada yazmaya da başlıyorum — kameranın önünde söylemeye fırsat bulamadığım şeyler için.</p>
<h2>Bu blogda ne göreceksin?</h2>
<ul>
  <li><strong>Perde arkası:</strong> Video yapım sürecim, neyi neden kestiğim.</li>
  <li><strong>Setup notları:</strong> Yeni denediğim ekipmanlar, gerçek hayatta nasıl iş gördükleri.</li>
  <li><strong>Düşünce yazıları:</strong> İçerik üretmek, izlenmek ve internette var olmak üzerine kısa parçalar.</li>
</ul>
<h2>Neden burada yazıyorum?</h2>
<p>YouTube videoda her şeyi söyleyemiyor. Bazı konular yavaş okuma istiyor; yorumun zamana ihtiyacı var. Bu blog tam olarak o iş için.</p>
<p>Aklında bir soru veya önerin varsa <a href="/iletisim">iletişim sayfasından</a> bana yazabilirsin. Yeni yazılardan haberdar olmak istersen ana sayfadaki e-bültene abone olabilirsin.</p>`,
    contentEn: `<p>For a long time I only made videos. This year I’m adding writing — for the things I never get to say in front of the camera.</p>
<h2>What to expect</h2>
<ul>
  <li><strong>Behind the scenes:</strong> How I make a video, what I cut and why.</li>
  <li><strong>Setup notes:</strong> New gear I try, how it actually performs day to day.</li>
  <li><strong>Short essays:</strong> About making content, being watched, and existing online.</li>
</ul>
<h2>Why a blog?</h2>
<p>YouTube can’t carry everything. Some thoughts need slower reading. This blog is exactly for that.</p>
<p>If you have a question or suggestion, reach out from the <a href="/iletisim">contact page</a>. To get new posts in your inbox, subscribe to the newsletter on the homepage.</p>`,
  },
  {
    id: 'starter-2',
    slug: 'icerik-uretirken-ogrendigim-3-sey',
    date: '2026-01-25',
    category: 'Süreç',
    categoryEn: 'Process',
    readTime: 4,
    image: null,
    titleTr: 'İçerik üretirken öğrendiğim 3 şey',
    titleEn: 'Three things making content taught me',
    excerptTr:
      'Yıllar içinde kameranın önünde ve arkasında biriktirdiğim küçük dersler — yeni başlayanlara işe yarayabilir.',
    excerptEn:
      'Small lessons from years on both sides of the camera — useful if you’re just getting started.',
    contentTr: `<h2>1. Kötü bir bölüm hiç bölüm olmamasından iyidir</h2>
<p>İçeriği aşırı cilalamak iki şeye yol açıyor: takvim kayıyor ve sen yorulup bırakıyorsun. “Yeterince iyi” diye bir eşik koy ve onun üstünde yayınla.</p>
<h2>2. İzleyicinle konuşurken kendine yazarsın</h2>
<p>Yorumları ve mesajları okumak — özellikle olumsuzlarını — eninde sonunda nasıl üreteceğini şekillendiriyor. İzleyici geri bildirimi “proje yönetimi” değil; içeriğin DNA’sı.</p>
<h2>3. Setup’ı son aşamada düşün</h2>
<p>Daha iyi bir kamera daha iyi bir hikâye yapmıyor. Önce ne anlatacağını netleştir; ekipman fikrin etrafında şekillensin.</p>
<p>Bu üç kuralı kendime yazıyorum — sonsuz tekrar etmek gerekiyor çünkü unutmak kolay.</p>`,
    contentEn: `<h2>1. A bad episode beats no episode</h2>
<p>Over-polishing content does two things: schedule slips and you burn out. Pick a “good enough” bar and ship above it.</p>
<h2>2. Talking to your audience writes for you</h2>
<p>Reading comments and DMs — especially the negative ones — eventually shapes how you make things. Audience feedback isn’t project management; it’s the DNA of the content.</p>
<h2>3. Think about gear last</h2>
<p>A better camera doesn’t make a better story. Get the story straight first, then let the gear follow.</p>
<p>I write these three rules down for myself — they’re easy to forget and need endless repetition.</p>`,
  },
]

export const partnersData = []
