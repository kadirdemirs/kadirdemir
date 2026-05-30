import {
  HiOutlineUser,
  HiOutlineCamera,
  HiOutlineMail,
} from 'react-icons/hi'
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa'
import ResponsivePortrait from '../components/ResponsivePortrait'
import Reveal from '../components/Reveal'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import './About.css'

export default function About() {
  const { settings } = useSiteSettings()
  const { t, lang } = useLanguage()
  const isEn = lang === 'en'
  const youtubeUrl = settings.youtube || 'https://youtube.com/@kadirardademirr'
  const instagramUrl = settings.instagram || 'https://instagram.com/kadirardademir'
  const tiktokUrl = settings.tiktok || 'https://tiktok.com/@kadirardademir'
  const emailAddr = settings.businessEmail || settings.email || 'thekademedia@gmail.com'
  const brandName = settings.businessName || 'Kadir Demir'

  useSEO({
    title: isEn ? `About ${brandName}` : `Hakkımda — ${brandName}`,
    description: isEn
      ? `${brandName} — content creator from Istanbul. The story behind the channel, what I make, and how to reach me.`
      : `${brandName} — İstanbul'dan içerik üreticisi. Kanalın hikâyesi, ne ürettiğim ve bana nasıl ulaşabileceğin.`,
    path: '/hakkimda',
    type: 'profile',
  })

  return (
    <div className="kd-about">
      <section className="kd-about-hero">
        <span className="kd-about-pill">
          <HiOutlineUser size={14} /> {t('about.pill')}
        </span>
        <h1>
          {t('about.heroHi')} <span className="kd-accent">{brandName}</span>.
        </h1>
        <p>{t('about.heroSub')}</p>
      </section>

      <Reveal as="section" className="kd-about-split">
        <div className="kd-about-media kd-media-frame">
          <span className="kd-about-tag">
            <HiOutlineCamera size={14} /> {t('about.studio')}
          </span>
          <ResponsivePortrait
            alt={`${brandName} — ${t('about.studio')}`}
            className="kd-about-img"
            sizes="(max-width: 820px) 100vw, 520px"
          />
        </div>
        <div className="kd-about-text">
          <h2>
            {t('about.title1A')}
            <br />
            {t('about.title1B')} <span className="kd-accent">{t('about.title1C')}</span>.
          </h2>
          <p>{t('about.p1')}</p>
          <p>
            {t('about.p2')} <strong>{t('about.p2Quote')}</strong>{t('about.p2End')}
          </p>
          <p>{t('about.p3')}</p>
        </div>
      </Reveal>

      <Reveal as="section" className="kd-about-split kd-about-split-reverse">
        <div className="kd-about-text">
          <h2>
            {t('about.title2A')}
            <br />
            {t('about.title2B')} <span className="kd-accent">{t('about.title2C')}</span>.
          </h2>
          <p>{t('about.p4')}</p>
          <p>{t('about.p5')}</p>
        </div>
        <div className="kd-about-media kd-media-frame">
          <ResponsivePortrait
            alt={`${brandName} — behind the scenes`}
            className="kd-about-img kd-about-img-alt"
            sizes="(max-width: 820px) 100vw, 520px"
          />
        </div>
      </Reveal>

      <Reveal as="section" className="kd-about-cta">
        <div>
          <h3>
            {t('about.ctaTitleA')} <span className="kd-accent">{t('about.ctaTitleB')}</span> {t('about.ctaTitleC')}
          </h3>
          <p>{t('about.ctaSub')}</p>
        </div>
        <div className="kd-about-cta-actions">
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="kd-cta-link">
            <FaYoutube /> {t('about.ytCta')}
          </a>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="kd-cta-link">
            <FaInstagram /> {t('about.igCta')}
          </a>
          <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="kd-cta-link">
            <FaTiktok /> {t('about.ttCta')}
          </a>
          <a href={`mailto:${emailAddr}`} className="kd-cta-link">
            <HiOutlineMail /> {t('about.mailCta')}
          </a>
        </div>
      </Reveal>
    </div>
  )
}
