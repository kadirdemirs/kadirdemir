import { createElement } from 'react'
import {
  HiOutlineCamera,
  HiOutlineDesktopComputer,
  HiOutlineChip,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import {
  FaGamepad,
  FaMicrochip,
  FaMemory,
  FaHdd,
  FaServer,
  FaSnowflake,
  FaKeyboard,
  FaMouse,
  FaHeadphones,
  FaMicrophone,
  FaVideo,
  FaTabletAlt,
  FaLightbulb,
  FaBoxOpen,
} from 'react-icons/fa'
import { useSEO } from '../hooks/useSEO'
import { BreadcrumbSchema } from '../components/StructuredData'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import Reveal from '../components/Reveal'
import './Setup.css'

// Default items used until the admin overrides them in site settings.
const DEFAULT_PC = [
  { kind: 'EKRAN KARTI', name: 'MSI GeForce RTX 5060 8GB Shadow 2X', iconKey: 'gpu', url: '' },
  { kind: 'İŞLEMCİ', name: 'AMD Ryzen 5 8400F', iconKey: 'cpu', url: '' },
  { kind: 'ANAKART', name: 'ASUS Prime B650M-R', iconKey: 'mobo', url: '' },
  { kind: 'RAM', name: '(2x) XPG Lancer RGB Black 16GB DDR5 6000MHz', iconKey: 'ram', url: '' },
  { kind: 'SSD', name: 'WD Blue SN580 Gen4 1TB', iconKey: 'ssd', url: '' },
  { kind: 'KASA & PSU', name: 'Cougar MX220 650W 80+', iconKey: 'case', url: '' },
  { kind: 'SIVI SOĞUTUCU', name: 'Corsair iCUE LINK H100i RGB', iconKey: 'cool', url: '' },
]

const DEFAULT_EQUIPMENT = [
  { kind: 'MONİTÖR', name: 'ASUS ROG Swift PG27VQ', iconKey: 'monitor', url: '' },
  { kind: 'KULAKLIK', name: 'HyperX Cloud II Core Wireless', iconKey: 'headphones', url: '' },
  { kind: 'KLAVYE', name: 'Logitech G PRO X TKL LIGHTSPEED', iconKey: 'keyboard', url: '' },
  { kind: 'MOUSE', name: 'Logitech G PRO X Superlight 2 DEX', iconKey: 'mouse', url: '' },
  { kind: 'MOUSEPAD', name: 'Klasse Longteng Huoyun Special Edition', iconKey: 'pad', url: '' },
  { kind: 'MİKROFON', name: 'HyperX Quadcast', iconKey: 'mic', url: '' },
  { kind: 'WEBCAM', name: 'Logitech C920 HD Pro', iconKey: 'cam', url: '' },
  { kind: 'STREAM DECK', name: 'Razer Stream Controller', iconKey: 'deck', url: '' },
]

const ICON_MAP = {
  gpu: FaGamepad,
  cpu: HiOutlineChip,
  mobo: FaMicrochip,
  ram: FaMemory,
  ssd: FaHdd,
  case: FaServer,
  cool: FaSnowflake,
  monitor: HiOutlineDesktopComputer,
  headphones: FaHeadphones,
  keyboard: FaKeyboard,
  mouse: FaMouse,
  pad: FaTabletAlt,
  mic: FaMicrophone,
  cam: FaVideo,
  deck: FaTabletAlt,
  light: FaLightbulb,
  other: FaBoxOpen,
}

function pickIcon(item) {
  if (item?.iconKey && ICON_MAP[item.iconKey]) return ICON_MAP[item.iconKey]
  const kind = (item?.kind || '').toLowerCase()
  if (/gpu|ekran/.test(kind)) return FaGamepad
  if (/i̇şlem|islem|cpu/.test(kind)) return HiOutlineChip
  if (/anakart|mobo/.test(kind)) return FaMicrochip
  if (/ram|bellek/.test(kind)) return FaMemory
  if (/ssd|disk|hdd/.test(kind)) return FaHdd
  if (/kasa|psu|güç|guc/.test(kind)) return FaServer
  if (/soğut|cool|liquid/.test(kind)) return FaSnowflake
  if (/monit/.test(kind)) return HiOutlineDesktopComputer
  if (/kulakl/.test(kind)) return FaHeadphones
  if (/klavye/.test(kind)) return FaKeyboard
  if (/mouse|fare/.test(kind)) return FaMouse
  if (/mousepad|altl/.test(kind)) return FaTabletAlt
  if (/mikrofon|mic/.test(kind)) return FaMicrophone
  if (/webcam|cam|kamera/.test(kind)) return FaVideo
  if (/stream|deck/.test(kind)) return FaTabletAlt
  if (/işık|isik|light/.test(kind)) return FaLightbulb
  return FaBoxOpen
}

function SetupItem({ item }) {
  const isLink = Boolean(item.url && item.url !== '#')
  const linkProps = {
    href: item.url,
    target: '_blank',
    rel: 'noopener noreferrer sponsored',
  }
  const iconNode = createElement(pickIcon(item), { size: 20 })

  const inner = (
    <>
      <span className="kd-setup-icon">{iconNode}</span>
      <div className="kd-setup-body">
        <div className="kd-setup-kind">{item.kind}</div>
        <div className="kd-setup-name">{item.name}</div>
      </div>
      {isLink && (
        <span className="kd-setup-link" aria-label="Ürün sayfası">
          <HiOutlineExternalLink size={16} />
        </span>
      )}
    </>
  )

  if (isLink) {
    return (
      <a className="kd-setup-card" {...linkProps}>
        {inner}
      </a>
    )
  }
  return (
    <div className="kd-setup-card" aria-disabled="true">
      {inner}
    </div>
  )
}

export default function Setup() {
  const { settings } = useSiteSettings()

  useSEO({
    title: 'Stüdyo Setup',
    description: 'Kadir Demir’in stüdyo setup’ı — bilgisayar, kamera, mikrofon ve diğer ekipmanlar.',
    path: '/setup',
  })

  const pcParts = Array.isArray(settings.setupPC) && settings.setupPC.length
    ? settings.setupPC
    : DEFAULT_PC
  const equipment = Array.isArray(settings.setupEquipment) && settings.setupEquipment.length
    ? settings.setupEquipment
    : DEFAULT_EQUIPMENT

  return (
    <div className="kd-setup">
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', path: '/' },
          { name: 'Setup', path: '/setup' },
        ]}
      />
      <header className="kd-setup-head">
        <span className="kd-setup-pill">
          <HiOutlineCamera size={14} /> Stüdyo Kurulumu
        </span>
        <h1>
          Stüdyomda <span className="kd-accent">neler var?</span>
        </h1>
        <p>
          Yıllar içinde test edip uzun süredir kullandığım donanımları burada bir araya
          getirdim. İçerik üretmek isteyenlere referans olur diye. Bazı linkler iş birliği
          (affiliate) olabilir — fiyatı sana göre değiştirmiyor.
        </p>
      </header>

      <Reveal as="section" className="kd-setup-section">
        <div className="kd-setup-section-title">
          <span className="kd-setup-number">01</span>
          <span className="kd-setup-section-icon">
            <HiOutlineChip size={20} />
          </span>
          <h2>Bilgisayar Özellikleri</h2>
        </div>
        <div className="kd-setup-grid">
          {pcParts.map((item, idx) => (
            <SetupItem key={`pc-${item.kind || idx}`} item={item} />
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="kd-setup-section">
        <div className="kd-setup-section-title">
          <span className="kd-setup-number">02</span>
          <span className="kd-setup-section-icon">
            <HiOutlineDesktopComputer size={20} />
          </span>
          <h2>Ekipmanlar</h2>
        </div>
        <div className="kd-setup-grid">
          {equipment.map((item, idx) => (
            <SetupItem key={`eq-${item.kind || idx}`} item={item} />
          ))}
        </div>
      </Reveal>
    </div>
  )
}
