import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import './RichEditor.css'

const TOOLBAR = [
  { cmd: 'toggleBold',        label: 'B',   title: 'Kalın (Ctrl+B)',     active: 'bold' },
  { cmd: 'toggleItalic',      label: 'İ',   title: 'İtalik (Ctrl+I)',    active: 'italic' },
  { cmd: 'toggleUnderline',   label: 'U',   title: 'Altı çizili',        active: 'underline' },
  { cmd: 'toggleStrike',      label: 'S̶',   title: 'Üstü çizili',       active: 'strike' },
  null,
  { cmd: 'h2',                label: 'H2',  title: 'Başlık 2',           active: 'heading', level: 2 },
  { cmd: 'h3',                label: 'H3',  title: 'Başlık 3',           active: 'heading', level: 3 },
  null,
  { cmd: 'toggleBulletList',  label: '• —', title: 'Madde listesi',      active: 'bulletList' },
  { cmd: 'toggleOrderedList', label: '1.', title: 'Numaralı liste',      active: 'orderedList' },
  { cmd: 'toggleBlockquote',  label: '❝',   title: 'Alıntı',             active: 'blockquote' },
  { cmd: 'toggleCodeBlock',   label: '</>',  title: 'Kod bloğu',          active: 'codeBlock' },
  null,
  { cmd: 'alignLeft',         label: '⬛←', title: 'Sola hizala',        active: null },
  { cmd: 'alignCenter',       label: '⬛—', title: 'Ortala',             active: null },
  null,
  { cmd: 'undo',              label: '↩',   title: 'Geri al (Ctrl+Z)',   active: null },
  { cmd: 'redo',              label: '↪',   title: 'İleri al',           active: null },
]

export default function RichEditor({ value = '', onChange, placeholder = 'Yazmaya başla…', lang = 'tr' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  if (!editor) return null

  const run = (item) => {
    if (!item) return
    const chain = editor.chain().focus()
    switch (item.cmd) {
      case 'toggleBold':        chain.toggleBold().run(); break
      case 'toggleItalic':      chain.toggleItalic().run(); break
      case 'toggleUnderline':   chain.toggleUnderline().run(); break
      case 'toggleStrike':      chain.toggleStrike().run(); break
      case 'h2':                chain.toggleHeading({ level: 2 }).run(); break
      case 'h3':                chain.toggleHeading({ level: 3 }).run(); break
      case 'toggleBulletList':  chain.toggleBulletList().run(); break
      case 'toggleOrderedList': chain.toggleOrderedList().run(); break
      case 'toggleBlockquote':  chain.toggleBlockquote().run(); break
      case 'toggleCodeBlock':   chain.toggleCodeBlock().run(); break
      case 'alignLeft':         chain.setTextAlign('left').run(); break
      case 'alignCenter':       chain.setTextAlign('center').run(); break
      case 'undo':              chain.undo().run(); break
      case 'redo':              chain.redo().run(); break
      default: break
    }
  }

  const isActive = (item) => {
    if (!item?.active) return false
    if (item.level) return editor.isActive(item.active, { level: item.level })
    return editor.isActive(item.active)
  }

  const insertLink = () => {
    const url = window.prompt('Link URL:')
    if (!url) return
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      alert('Geçersiz URL. https:// veya mailto: ile başlamalı.')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = () => {
    const url = window.prompt('Görsel URL:')
    if (!url) return
    if (!/^https?:\/\//i.test(url) && !url.startsWith('data:image/')) {
      alert('Geçersiz görsel URL. https:// ile başlamalı.')
      return
    }
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        {TOOLBAR.map((item, i) =>
          item === null
            ? <span key={i} className="rich-sep" />
            : (
              <button
                key={item.cmd}
                type="button"
                title={item.title}
                className={`rich-btn ${isActive(item) ? 'is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); run(item) }}
              >
                {item.label}
              </button>
            )
        )}
        <button type="button" className="rich-btn" title="Link ekle" onMouseDown={(e) => { e.preventDefault(); insertLink() }}>🔗</button>
        <button type="button" className="rich-btn" title="Görsel ekle" onMouseDown={(e) => { e.preventDefault(); insertImage() }}>🖼</button>
        <button type="button" className="rich-btn" title="Yatay çizgi" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run() }}>—</button>
      </div>
      <EditorContent editor={editor} className="rich-content" />
    </div>
  )
}
