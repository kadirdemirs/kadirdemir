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
} from 'react-icons/fa'
import './Setup.css'

const pcParts = [
  { kind: 'EKRAN KARTI', name: 'MSI GeForce RTX 5060 8GB Shadow 2X', icon: FaGamepad, url: '#' },
  { kind: 'İŞLEMCİ', name: 'AMD Ryzen 5 8400F', icon: HiOutlineChip, url: '#' },
  { kind: 'ANAKART', name: 'ASUS Prime B650M-R', icon: FaMicrochip, url: '#' },
  { kind: 'RAM', name: '(2x) XPG Lancer RGB Black 16GB DDR5 6000MHz', icon: FaMemory, url: '#' },
  { kind: 'SSD', name: 'WD Blue SN580 Gen4 1TB', icon: FaHdd, url: '#' },
  { kind: 'KASA & PSU', name: 'Cougar MX220 650W 80+', icon: FaServer, url: '#' },
  { kind: 'SIVI SOĞUTUCU', name: 'Corsair iCUE LINK H100i RGB', icon: FaSnowflake, url: '#' },
]

const equipment = [
  { kind: 'MONİTÖR', name: 'ASUS ROG Swift PG27VQ', icon: HiOutlineDesktopComputer, url: '#' },
  { kind: 'KULAKLIK', name: 'HyperX Cloud II Core Wireless', icon: FaHeadphones, url: '#' },
  { kind: 'KLAVYE', name: 'Logitech G PRO X TKL LIGHTSPEED', icon: FaKeyboard, url: '#' },
  { kind: 'MOUSE', name: 'Logitech G PRO X Superlight 2 DEX', icon: FaMouse, url: '#' },
  { kind: 'MOUSEPAD', name: 'Klasse Longteng Huoyun Special Edition', icon: FaTabletAlt, url: '#' },
  { kind: 'MİKROFON', name: 'HyperX Quadcast', icon: FaMicrophone, url: '#' },
  { kind: 'WEBCAM', name: 'Logitech C920 HD Pro', icon: FaVideo, url: '#' },
  { kind: 'STREAM DECK', name: 'Razer Stream Controller', icon: FaTabletAlt, url: '#' },
]

function SetupItem({ item }) {
  return (
    <a href={item.url} className="kd-setup-card" target="_blank" rel="noopener noreferrer">
      <span className="kd-setup-icon">
        <item.icon size={20} />
      </span>
      <div className="kd-setup-body">
        <div className="kd-setup-kind">{item.kind}</div>
        <div className="kd-setup-name">{item.name}</div>
      </div>
      <span className="kd-setup-link">
        <HiOutlineExternalLink size={16} />
      </span>
    </a>
  )
}

export default function Setup() {
  return (
    <div className="kd-setup">
      <header className="kd-setup-head">
        <span className="kd-setup-pill">
          <HiOutlineCamera size={14} /> Stüdyo Kurulumu
        </span>
        <h1>
          Stüdyomda <span className="kd-accent">neler var?</span>
        </h1>
        <p>
          Yıllar içinde test edip uzun süredir kullandığım donanımları burada bir araya
          getirdim. İçerik üretmek isteyenlere referans olur diye.
        </p>
      </header>

      <section className="kd-setup-section">
        <div className="kd-setup-section-title">
          <span className="kd-setup-number">01</span>
          <span className="kd-setup-section-icon">
            <HiOutlineChip size={20} />
          </span>
          <h2>Bilgisayar Özellikleri</h2>
        </div>
        <div className="kd-setup-grid">
          {pcParts.map((item) => (
            <SetupItem key={item.kind} item={item} />
          ))}
        </div>
      </section>

      <section className="kd-setup-section">
        <div className="kd-setup-section-title">
          <span className="kd-setup-number">02</span>
          <span className="kd-setup-section-icon">
            <HiOutlineDesktopComputer size={20} />
          </span>
          <h2>Ekipmanlar</h2>
        </div>
        <div className="kd-setup-grid">
          {equipment.map((item) => (
            <SetupItem key={item.kind} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
