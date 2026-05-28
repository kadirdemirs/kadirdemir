import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import { useLanguage } from '../i18n/LanguageContext'
import './Legal.css'

export default function Gizlilik() {
  const { t } = useLanguage()
  useSEO({
    title: t('legal.privacyTitle'),
    description: `${t('legal.privacyTitle')} — Kadir Demir`,
    path: '/gizlilik',
  })

  return (
    <PageTransition>
      <div className="legal-page">
        <div className="grid-bg" />
        <div className="container">
          <FadeIn>
            <div className="legal-content glass-card">
              <h1>Gizlilik Politikası</h1>
              <p className="legal-date">Son güncelleme: Mart 2026</p>

              <h2>1. Genel Bilgi</h2>
              <p>
                Kadir Demir olarak kişisel verilerinizin güvenliğine büyük önem veriyoruz. Bu Gizlilik
                Politikası, web sitemizi (<strong>kadirdemir-nu.vercel.app</strong>) kullanırken hangi verilerin
                toplandığını ve bu verilerin nasıl kullanıldığını açıklamaktadır.
              </p>

              <h2>2. Toplanan Veriler</h2>
              <p>Web sitemizi ziyaret ettiğinizde veya iletişim formunu doldurduğunuzda şu veriler toplanabilir:</p>
              <ul>
                <li><strong>Kimlik bilgileri:</strong> Ad, soyad</li>
                <li><strong>İletişim bilgileri:</strong> E-posta, telefon numarası</li>
                <li><strong>Şirket bilgileri:</strong> Şirket adı, sektör</li>
                <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, ziyaret süresi (anonim)</li>
              </ul>

              <h2>3. Verilerin Kullanımı</h2>
              <p>Toplanan veriler şu amaçlarla kullanılır:</p>
              <ul>
                <li>Teklif ve bilgi taleplerinizi yanıtlamak</li>
                <li>Hizmet kalitemizi geliştirmek</li>
                <li>Yasal yükümlülükleri yerine getirmek</li>
              </ul>
              <p>Kişisel verileriniz üçüncü taraflarla satılmaz veya kiralanmaz.</p>

              <h2>4. Çerezler (Cookies)</h2>
              <p>
                Web sitemiz, deneyiminizi iyileştirmek için çerezler kullanmaktadır. Çerezlerin
                kullanımı hakkında daha fazla bilgi için{' '}
                <a href="/cerez-politikasi" style={{ color: 'var(--primary)' }}>Çerez Politikamızı</a>{' '}
                inceleyiniz.
              </p>

              <h2>5. Veri Güvenliği</h2>
              <p>
                Verileriniz, yetkisiz erişime karşı endüstri standardı güvenlik önlemleriyle
                korunmaktadır. SSL şifrelemesi ve güvenli sunucu altyapısı kullanılmaktadır.
              </p>

              <h2>6. Veri Saklama Süresi</h2>
              <p>
                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama
                yükümlülükleri kapsamında saklanır. İletişim formundan gelen veriler en fazla
                3 yıl süreyle saklanmaktadır.
              </p>

              <h2>7. Üçüncü Taraf Hizmetler</h2>
              <p>
                Web sitemiz Google Analytics (anonim trafik analizi) ve Google Maps
                (harita gösterimi) hizmetlerini kullanabilir. Bu hizmetlerin gizlilik
                politikaları için ilgili sağlayıcıların sitelerini inceleyiniz.
              </p>

              <h2>8. İletişim</h2>
              <p>
                Gizlilik politikamızla ilgili sorularınız için:{' '}
                <a href="mailto:thekademedia@gmail.com" style={{ color: 'var(--primary)' }}>
                  thekademedia@gmail.com
                </a>
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}
