import {
  HiOutlineUser,
  HiOutlineCamera,
  HiOutlineMail,
} from 'react-icons/hi'
import { FaYoutube, FaInstagram } from 'react-icons/fa'
import './About.css'

export default function About() {
  return (
    <div className="kd-about">
      <section className="kd-about-hero">
        <span className="kd-about-pill">
          <HiOutlineUser size={14} /> Hakkımda
        </span>
        <h1>
          Merhaba, ben <span className="kd-accent">Kadir Demir</span>.
        </h1>
        <p>
          İstanbul'dan yayın yapan bir içerik üreticisiyim. Yıllardır kameranın hem
          önünde hem arkasındayım. Bu sayfa beni biraz daha yakından tanımak isteyenler için.
        </p>
      </section>

      <section className="kd-about-split">
        <div className="kd-about-media kd-media-frame">
          <span className="kd-about-tag">
            <HiOutlineCamera size={14} /> STÜDYO
          </span>
        </div>
        <div className="kd-about-text">
          <h2>
            Hikaye anlatmaktan
            <br />
            hiç <span className="kd-accent">vazgeçmedim</span>.
          </h2>
          <p>
            Bir kameraya, doğru ışığa ve iyi bir mikrofona ihtiyaç duyduğumuz çağı geride
            bıraktık. Bugün herkes anlatabiliyor — ama herkesin sesini herkes duymuyor.
            Ben yıllardır o sesi bulmaya, korumaya ve büyütmeye çalışıyorum.
          </p>
          <p>
            Oyun, vlog, eğlence ya da bazen sadece bir an… Hepsinin altında aynı soru
            var: <strong>"Bu hikaye neden değerli?"</strong> Cevabı bulduğumda kaydı
            başlatıyorum.
          </p>
          <p>
            Yıllar içinde milyonlarca insan kanalıma uğradı, binlercesi sabit kaldı. Bu
            sayfa onlar için, ve henüz tanışmadığım sen için.
          </p>
        </div>
      </section>

      <section className="kd-about-split kd-about-split-reverse">
        <div className="kd-about-text">
          <h2>
            İçerik üretmek, benim
            <br />
            #1 <span className="kd-accent">tutkum</span>.
          </h2>
          <p>
            Çocukluğumdan beri kameranın hem önünde hem arkasında olmayı seviyorum. İlk
            videomu yıllar önce yükledim ve o günden bugüne izleyicilerimle birlikte
            büyüyen, gelişen bir kanal kurdum.
          </p>
          <p>
            Her video benim için yeni bir hikaye anlatma fırsatı. Sıradan bir günü bile
            ilginç hâle getirmek, izleyiciye değer katacak bir an yaratmak istiyorum.
          </p>
        </div>
        <div className="kd-about-media kd-media-frame" />
      </section>

      <section className="kd-about-cta">
        <div>
          <h3>
            Yolculuğa <span className="kd-accent">birlikte</span> devam edelim.
          </h3>
          <p>
            Yeni videolar, kulis notları ve bazen sadece günlük gelişmeler için beni sosyal
            medyada takip et — ya da doğrudan yaz, hep bir kahve eşliğinde okuyorum.
          </p>
        </div>
        <div className="kd-about-cta-actions">
          <a
            href="https://youtube.com/@kadirdemir"
            target="_blank"
            rel="noopener noreferrer"
            className="kd-cta-link"
          >
            <FaYoutube /> YouTube'da abone ol
          </a>
          <a
            href="https://instagram.com/kadirdemir"
            target="_blank"
            rel="noopener noreferrer"
            className="kd-cta-link"
          >
            <FaInstagram /> Instagram'da takip et
          </a>
          <a href="mailto:hello@kadirdemir.tv" className="kd-cta-link">
            <HiOutlineMail /> Doğrudan yaz
          </a>
        </div>
      </section>
    </div>
  )
}
