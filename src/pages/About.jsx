import {
  HiOutlineUser,
  HiOutlineCamera,
  HiOutlineMail,
} from 'react-icons/hi'
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa'
import ResponsivePortrait from '../components/ResponsivePortrait'
import Reveal from '../components/Reveal'
import { BreadcrumbSchema } from '../components/StructuredData'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import './About.css'

export default function About() {
  const { settings } = useSiteSettings()
  const { t, lang } = useLanguage()
  const isEn = lang === 'en'
  const youtubeUrl = settings.youtube
  const instagramUrl = settings.instagram
  const tiktokUrl = settings.tiktok
  const emailAddr = settings.businessEmail || settings.email
  const brandName = settings.businessName

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
      <BreadcrumbSchema items={[
        { name: isEn ? 'Home' : 'Ana Sayfa', path: '/' },
        { name: isEn ? 'About' : 'Hakkımda', path: '/hakkimda' },
      ]} />
      <section className="kd-about-hero">
        <span className="kd-about-pill">
          <HiOutlineUser size={14} /> {t('about.pill')}
        </span>
        <h1>
          {t('about.heroHi')} <span className="kd-accent">{brandName}</span>.
        </h1>
        <p>{t('about.heroSub')}</p>
      </section>

      <Reveal as="div" className="kd-about-stats">
        <div className="kd-about-stat">
          <span className="kd-about-stat-num">{settings.statsActiveYears || '14'}</span>
          <span className="kd-about-stat-label">{isEn ? 'Years active' : 'Yıl aktif'}</span>
        </div>
        {settings.statsTotalVideos && (
          <div className="kd-about-stat">
            <span className="kd-about-stat-num">{settings.statsTotalVideos}+</span>
            <span className="kd-about-stat-label">{isEn ? 'Videos' : 'Video'}</span>
          </div>
        )}
        {settings.statsYoutubeSubs && (
          <div className="kd-about-stat">
            <span className="kd-about-stat-num">{settings.statsYoutubeSubs}</span>
            <span className="kd-about-stat-label">{isEn ? 'Subscribers' : 'Abone'}</span>
          </div>
        )}
        {settings.statsTotalViews && (
          <div className="kd-about-stat">
            <span className="kd-about-stat-num">{settings.statsTotalViews}</span>
            <span className="kd-about-stat-label">{isEn ? 'Total views' : 'İzlenme'}</span>
          </div>
        )}
      </Reveal>

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
        <div className="kd-about-philosophy">
          <blockquote className="kd-about-philosophy-quote">
            {t('home.aboutQuote')}
          </blockquote>
          <ul className="kd-about-philosophy-list">
            <li>{isEn ? 'Honest, authentic content' : 'Dürüst, özgün içerik'}</li>
            <li>{isEn ? "Respect for the viewer's time" : 'İzleyici zamanına saygı'}</li>
            <li>{isEn ? 'Creativity beyond format limits' : 'Format sınırlarını aşan yaratıcılık'}</li>
            <li>{isEn ? '14 years on both sides of the camera' : '14 yıl kameranın iki tarafında'}</li>
          </ul>
          <div className="kd-about-philosophy-footer">
            <span>📍 İstanbul</span>
            <span>{isEn ? 'Since 2011' : '2011\'den beri'}</span>
          </div>
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
