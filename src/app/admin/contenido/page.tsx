'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle2, X, Plus, PenSquare, Image as ImageIcon, MessageSquare, BarChart3, Palette, FileText, Trash2, Star } from 'lucide-react';

interface Testimonial { id: string; name: string; role: string; company: string; text: string; rating: number; avatar: string; isActive: boolean; }
interface Banner { id: string; title: string; subtitle: string; image: string; link: string; position: string; isActive: boolean; }
interface Stat { value: string; label: string; }
interface Value { title: string; description: string; }

interface Content {
  hero: { badge: string; title: string; highlight: string; subtitle: string; ctaPrimary: string; ctaSecondary: string; stats: Stat[] };
  about: { title: string; description: string; image: string; values: Value[] };
  testimonials: Testimonial[];
  banners: Banner[];
  branding: { logo: string; logoWhite: string; favicon: string; ogImage: string; primaryColor: string; accentColor: string };
  footer: { description: string; copyright: string };
}

export default function AdminContenidoPage() {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('hero');

  useEffect(() => { fetch('/api/contenido').then((r) => r.json()).then((d) => { setContent(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const save = async () => {
    if (!content) return; setSaving(true); setSaved(false);
    await fetch('/api/contenido', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const u = (section: keyof Content, field: string, value: any) => {
    if (!content) return; setContent({ ...content, [section]: { ...(content[section] as any), [field]: value } }); setSaved(false);
  };

  const tabs = [
    { id: 'hero', label: 'Hero / Inicio', icon: PenSquare },
    { id: 'about', label: 'Nosotros', icon: FileText },
    { id: 'testimonials', label: 'Testimonios', icon: MessageSquare },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'branding', label: 'Marca / Logo', icon: Palette },
    { id: 'footer', label: 'Footer', icon: FileText },
  ];

  if (loading || !content) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-bright" /></div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-display text-h1 uppercase text-arctic">Contenido</h1><p className="mt-1 font-body text-body-sm text-steel-300">Edita el contenido de tu sitio web</p></div>
        <button onClick={save} disabled={saving} className="btn-primary gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar todo'}
        </button>
      </div>
      {saved && <div className="alert-success mb-4"><CheckCircle2 className="h-4 w-4 shrink-0" />Contenido guardado correctamente</div>}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-steel-900/40 pb-0">
        {tabs.map((t) => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 font-body text-body-sm transition-colors ${tab === t.id ? 'border-blue text-blue-bright' : 'border-transparent text-steel-500 hover:text-arctic'}`}>
            <Icon className="h-4 w-4" />{t.label}
          </button>
        ); })}
      </div>

      {/* HERO */}
      {tab === 'hero' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-h3 text-arctic">Seccion Hero (pagina principal)</h2>
          <F label="Badge / Etiqueta" v={content.hero.badge} c={(v) => u('hero', 'badge', v)} />
          <F label="Titulo principal" v={content.hero.title} c={(v) => u('hero', 'title', v)} />
          <F label="Subtitulo destacado" v={content.hero.highlight} c={(v) => u('hero', 'highlight', v)} />
          <div><label className="label mb-1 block">Texto descriptivo</label><textarea value={content.hero.subtitle} onChange={(e) => u('hero', 'subtitle', e.target.value)} className="input min-h-[80px]" rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Boton primario (texto)" v={content.hero.ctaPrimary} c={(v) => u('hero', 'ctaPrimary', v)} />
            <F label="Boton secundario (texto)" v={content.hero.ctaSecondary} c={(v) => u('hero', 'ctaSecondary', v)} />
          </div>
          <div>
            <label className="label mb-2 block">Estadisticas del hero</label>
            <div className="space-y-2">
              {content.hero.stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={s.value} onChange={(e) => { const st = [...content.hero.stats]; st[i] = { ...st[i], value: e.target.value }; u('hero', 'stats', st); }} className="input w-24 font-mono" placeholder="+150" />
                  <input type="text" value={s.label} onChange={(e) => { const st = [...content.hero.stats]; st[i] = { ...st[i], label: e.target.value }; u('hero', 'stats', st); }} className="input flex-1" placeholder="Proyectos" />
                  <button onClick={() => { const st = content.hero.stats.filter((_, j) => j !== i); u('hero', 'stats', st); }} className="p-1 text-steel-700 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => u('hero', 'stats', [...content.hero.stats, { value: '', label: '' }])} className="btn-ghost py-1 text-caption"><Plus className="h-3 w-3" /> Agregar stat</button>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT */}
      {tab === 'about' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-h3 text-arctic">Seccion Nosotros</h2>
          <F label="Titulo" v={content.about.title} c={(v) => u('about', 'title', v)} />
          <div><label className="label mb-1 block">Descripcion</label><textarea value={content.about.description} onChange={(e) => u('about', 'description', e.target.value)} className="input min-h-[80px]" rows={3} /></div>
          <F label="Imagen (URL)" v={content.about.image} c={(v) => u('about', 'image', v)} />
          {content.about.image && <img src={content.about.image} alt="" className="h-32 rounded-md object-cover" />}
          <div>
            <label className="label mb-2 block">Valores de la empresa</label>
            <div className="space-y-2">
              {content.about.values.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={val.title} onChange={(e) => { const vs = [...content.about.values]; vs[i] = { ...vs[i], title: e.target.value }; u('about', 'values', vs); }} className="input w-32" placeholder="Titulo" />
                  <input type="text" value={val.description} onChange={(e) => { const vs = [...content.about.values]; vs[i] = { ...vs[i], description: e.target.value }; u('about', 'values', vs); }} className="input flex-1" placeholder="Descripcion" />
                  <button onClick={() => u('about', 'values', content.about.values.filter((_, j) => j !== i))} className="p-1 text-steel-700 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => u('about', 'values', [...content.about.values, { title: '', description: '' }])} className="btn-ghost py-1 text-caption"><Plus className="h-3 w-3" /> Agregar valor</button>
            </div>
          </div>
        </div>
      )}

      {/* TESTIMONIALS */}
      {tab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-display text-h3 text-arctic">Testimonios</h2>
            <button onClick={() => setContent({ ...content, testimonials: [...content.testimonials, { id: Date.now().toString(36), name: '', role: '', company: '', text: '', rating: 5, avatar: '', isActive: true }] })} className="btn-primary text-caption"><Plus className="h-3 w-3" /> Agregar</button>
          </div>
          {content.testimonials.length === 0 && <div className="card p-8 text-center"><MessageSquare className="mx-auto h-10 w-10 text-steel-700" /><p className="mt-3 text-body-sm text-steel-500">Sin testimonios aun</p></div>}
          {content.testimonials.map((t, i) => (
            <div key={t.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge-blue">Testimonio #{i + 1}</span>
                <div className="flex gap-1">
                  <label className="flex items-center gap-1 text-caption"><input type="checkbox" checked={t.isActive} onChange={(e) => { const ts = [...content.testimonials]; ts[i] = { ...ts[i], isActive: e.target.checked }; setContent({ ...content, testimonials: ts }); }} className="h-3 w-3 accent-blue" />Activo</label>
                  <button onClick={() => setContent({ ...content, testimonials: content.testimonials.filter((_, j) => j !== i) })} className="p-1 text-steel-700 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={t.name} onChange={(e) => { const ts = [...content.testimonials]; ts[i] = { ...ts[i], name: e.target.value }; setContent({ ...content, testimonials: ts }); }} className="input" placeholder="Nombre" />
                <input type="text" value={t.role} onChange={(e) => { const ts = [...content.testimonials]; ts[i] = { ...ts[i], role: e.target.value }; setContent({ ...content, testimonials: ts }); }} className="input" placeholder="Cargo" />
                <input type="text" value={t.company} onChange={(e) => { const ts = [...content.testimonials]; ts[i] = { ...ts[i], company: e.target.value }; setContent({ ...content, testimonials: ts }); }} className="input" placeholder="Empresa" />
              </div>
              <textarea value={t.text} onChange={(e) => { const ts = [...content.testimonials]; ts[i] = { ...ts[i], text: e.target.value }; setContent({ ...content, testimonials: ts }); }} className="input" placeholder="Texto del testimonio" rows={2} />
              <div className="flex items-center gap-3">
                <input type="url" value={t.avatar} onChange={(e) => { const ts = [...content.testimonials]; ts[i] = { ...ts[i], avatar: e.target.value }; setContent({ ...content, testimonials: ts }); }} className="input flex-1" placeholder="URL avatar" />
                <div className="flex items-center gap-1">{[1,2,3,4,5].map((n) => <button key={n} onClick={() => { const ts = [...content.testimonials]; ts[i] = { ...ts[i], rating: n }; setContent({ ...content, testimonials: ts }); }}><Star className={`h-4 w-4 ${n <= t.rating ? 'fill-yellow text-yellow' : 'text-steel-700'}`} /></button>)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BANNERS */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-display text-h3 text-arctic">Banners</h2>
            <button onClick={() => setContent({ ...content, banners: [...content.banners, { id: Date.now().toString(36), title: '', subtitle: '', image: '', link: '', position: 'home', isActive: true }] })} className="btn-primary text-caption"><Plus className="h-3 w-3" /> Agregar</button>
          </div>
          {content.banners.length === 0 && <div className="card p-8 text-center"><ImageIcon className="mx-auto h-10 w-10 text-steel-700" /><p className="mt-3 text-body-sm text-steel-500">Sin banners configurados</p></div>}
          {content.banners.map((b, i) => (
            <div key={b.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge-yellow">Banner #{i + 1}</span>
                <div className="flex gap-1">
                  <label className="flex items-center gap-1 text-caption"><input type="checkbox" checked={b.isActive} onChange={(e) => { const bs = [...content.banners]; bs[i] = { ...bs[i], isActive: e.target.checked }; setContent({ ...content, banners: bs }); }} className="h-3 w-3 accent-blue" />Activo</label>
                  <button onClick={() => setContent({ ...content, banners: content.banners.filter((_, j) => j !== i) })} className="p-1 text-steel-700 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={b.title} onChange={(e) => { const bs = [...content.banners]; bs[i] = { ...bs[i], title: e.target.value }; setContent({ ...content, banners: bs }); }} className="input" placeholder="Titulo" />
                <input type="text" value={b.subtitle} onChange={(e) => { const bs = [...content.banners]; bs[i] = { ...bs[i], subtitle: e.target.value }; setContent({ ...content, banners: bs }); }} className="input" placeholder="Subtitulo" />
                <input type="url" value={b.image} onChange={(e) => { const bs = [...content.banners]; bs[i] = { ...bs[i], image: e.target.value }; setContent({ ...content, banners: bs }); }} className="input" placeholder="URL imagen" />
                <input type="text" value={b.link} onChange={(e) => { const bs = [...content.banners]; bs[i] = { ...bs[i], link: e.target.value }; setContent({ ...content, banners: bs }); }} className="input" placeholder="URL destino" />
              </div>
              {b.image && <img src={b.image} alt="" className="h-24 w-full rounded-md object-cover" />}
            </div>
          ))}
        </div>
      )}

      {/* BRANDING */}
      {tab === 'branding' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-h3 text-arctic">Marca y apariencia</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label mb-1 block">Logo principal (URL)</label><input type="url" value={content.branding.logo} onChange={(e) => u('branding', 'logo', e.target.value)} className="input" placeholder="https://..." /></div>
            <div><label className="label mb-1 block">Logo blanco (URL)</label><input type="url" value={content.branding.logoWhite} onChange={(e) => u('branding', 'logoWhite', e.target.value)} className="input" placeholder="https://..." /></div>
          </div>
          {(content.branding.logo || content.branding.logoWhite) && (
            <div className="flex gap-4">
              {content.branding.logo && <div className="rounded-md border border-steel-900/40 bg-arctic p-4"><img src={content.branding.logo} alt="Logo" className="h-12 object-contain" /></div>}
              {content.branding.logoWhite && <div className="rounded-md border border-steel-900/40 bg-carbon p-4"><img src={content.branding.logoWhite} alt="Logo white" className="h-12 object-contain" /></div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <F label="Favicon (URL)" v={content.branding.favicon} c={(v) => u('branding', 'favicon', v)} />
            <F label="OG Image (URL)" v={content.branding.ogImage} c={(v) => u('branding', 'ogImage', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1 block">Color primario</label>
              <div className="flex items-center gap-2">
                <input type="color" value={content.branding.primaryColor} onChange={(e) => u('branding', 'primaryColor', e.target.value)} className="h-10 w-10 cursor-pointer rounded border-0 bg-transparent" />
                <input type="text" value={content.branding.primaryColor} onChange={(e) => u('branding', 'primaryColor', e.target.value)} className="input flex-1 font-mono" />
              </div>
            </div>
            <div>
              <label className="label mb-1 block">Color acento</label>
              <div className="flex items-center gap-2">
                <input type="color" value={content.branding.accentColor} onChange={(e) => u('branding', 'accentColor', e.target.value)} className="h-10 w-10 cursor-pointer rounded border-0 bg-transparent" />
                <input type="text" value={content.branding.accentColor} onChange={(e) => u('branding', 'accentColor', e.target.value)} className="input flex-1 font-mono" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      {tab === 'footer' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-h3 text-arctic">Footer</h2>
          <div><label className="label mb-1 block">Descripcion</label><textarea value={content.footer.description} onChange={(e) => u('footer', 'description', e.target.value)} className="input" rows={2} /></div>
          <F label="Copyright" v={content.footer.copyright} c={(v) => u('footer', 'copyright', v)} />
        </div>
      )}
    </div>
  );
}

function F({ label, v, c, ph }: { label: string; v: string; c: (v: string) => void; ph?: string }) {
  return <div><label className="label mb-1 block">{label}</label><input type="text" value={v} onChange={(e) => c(e.target.value)} className="input" placeholder={ph} /></div>;
}
