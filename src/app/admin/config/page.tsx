'use client';

import { useEffect, useState } from 'react';
import {
  Save,
  Loader2,
  Settings,
  Globe,
  Phone,
  Mail,
  MapPin,
  Share2,
  Clock,
  Bell,
  Search as SearchIcon,
  CheckCircle2,
  DollarSign,
  Truck,
  X,
} from 'lucide-react';

interface SiteSettings {
  general: { siteName: string; siteDescription: string; siteUrl: string; logo: string };
  contact: { phone: string; email: string; address: string; city: string; whatsapp: string; mapUrl: string };
  social: { facebook: string; instagram: string; linkedin: string; youtube: string; tiktok: string };
  business: { openingHours: { weekdays: string; saturday: string; sunday: string }; currency: string; taxRate: number; shippingBase: number; freeShippingThreshold: number };
  notifications: { emailOnNewOrder: boolean; emailOnNewLead: boolean; whatsappOnNewOrder: boolean; adminEmail: string };
  seo: { metaTitle: string; metaDescription: string; ogImage: string; googleAnalyticsId: string; metaPixelId: string };
}

export default function AdminConfigPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then((d) => { setSettings(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if (!res.ok) throw new Error('Error al guardar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const update = (section: keyof SiteSettings, field: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [section]: { ...settings[section], [field]: value } });
    setSaved(false);
  };

  const updateNested = (section: keyof SiteSettings, parent: string, field: string, value: any) => {
    if (!settings) return;
    const sec = settings[section] as any;
    setSettings({ ...settings, [section]: { ...sec, [parent]: { ...sec[parent], [field]: value } } });
    setSaved(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'social', label: 'Redes sociales', icon: Share2 },
    { id: 'business', label: 'Negocio', icon: DollarSign },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'seo', label: 'SEO', icon: SearchIcon },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 font-display text-h1 uppercase text-arctic">Configuracion</h1>
        <div className="card animate-pulse p-6"><div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded bg-steel-900" />)}</div></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Configuracion</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Ajustes generales del sitio</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      {error && <div className="alert-danger mb-4"><X className="h-4 w-4 shrink-0" />{error}</div>}
      {saved && <div className="alert-success mb-4"><CheckCircle2 className="h-4 w-4 shrink-0" />Configuracion guardada correctamente</div>}

      <div className="flex gap-6">
        {/* Tabs sidebar */}
        <div className="hidden w-48 shrink-0 space-y-1 lg:block">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 font-body text-body-sm transition-all ${activeTab === tab.id ? 'bg-blue-muted text-blue-bright font-medium' : 'text-steel-300 hover:bg-steel-900 hover:text-arctic'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto lg:hidden">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 rounded-md px-3 py-2 font-body text-caption ${activeTab === tab.id ? 'bg-blue-muted text-blue-bright' : 'text-steel-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General */}
          {activeTab === 'general' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Globe className="h-5 w-5 text-blue-bright" /> Informacion general</h2>
              <div className="space-y-4">
                <Field label="Nombre del sitio" value={settings.general.siteName} onChange={(v) => update('general', 'siteName', v)} />
                <Field label="Descripcion" value={settings.general.siteDescription} onChange={(v) => update('general', 'siteDescription', v)} />
                <Field label="URL del sitio" value={settings.general.siteUrl} onChange={(v) => update('general', 'siteUrl', v)} />
                <Field label="URL del logo" value={settings.general.logo} onChange={(v) => update('general', 'logo', v)} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* Contact */}
          {activeTab === 'contact' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Phone className="h-5 w-5 text-blue-bright" /> Datos de contacto</h2>
              <div className="space-y-4">
                <Field label="Telefono" value={settings.contact.phone} onChange={(v) => update('contact', 'phone', v)} />
                <Field label="Email" value={settings.contact.email} onChange={(v) => update('contact', 'email', v)} />
                <Field label="WhatsApp" value={settings.contact.whatsapp} onChange={(v) => update('contact', 'whatsapp', v)} />
                <Field label="Direccion" value={settings.contact.address} onChange={(v) => update('contact', 'address', v)} />
                <Field label="Ciudad" value={settings.contact.city} onChange={(v) => update('contact', 'city', v)} />
                <Field label="URL Google Maps" value={settings.contact.mapUrl} onChange={(v) => update('contact', 'mapUrl', v)} placeholder="https://maps.google.com/..." />
              </div>
            </div>
          )}

          {/* Social */}
          {activeTab === 'social' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Share2 className="h-5 w-5 text-blue-bright" /> Redes sociales</h2>
              <div className="space-y-4">
                <Field label="Facebook" value={settings.social.facebook} onChange={(v) => update('social', 'facebook', v)} placeholder="https://facebook.com/..." />
                <Field label="Instagram" value={settings.social.instagram} onChange={(v) => update('social', 'instagram', v)} placeholder="https://instagram.com/..." />
                <Field label="LinkedIn" value={settings.social.linkedin} onChange={(v) => update('social', 'linkedin', v)} placeholder="https://linkedin.com/..." />
                <Field label="YouTube" value={settings.social.youtube} onChange={(v) => update('social', 'youtube', v)} placeholder="https://youtube.com/..." />
                <Field label="TikTok" value={settings.social.tiktok} onChange={(v) => update('social', 'tiktok', v)} placeholder="https://tiktok.com/..." />
              </div>
            </div>
          )}

          {/* Business */}
          {activeTab === 'business' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><DollarSign className="h-5 w-5 text-[#48BB78]" /> Configuracion de negocio</h2>
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-display text-h4 text-arctic"><Clock className="h-4 w-4 text-steel-300" /> Horarios de atencion</h3>
                <Field label="Lunes a Viernes" value={settings.business.openingHours.weekdays} onChange={(v) => updateNested('business', 'openingHours', 'weekdays', v)} />
                <Field label="Sabados" value={settings.business.openingHours.saturday} onChange={(v) => updateNested('business', 'openingHours', 'saturday', v)} />
                <Field label="Domingos" value={settings.business.openingHours.sunday} onChange={(v) => updateNested('business', 'openingHours', 'sunday', v)} />
                <div className="border-t border-steel-900/30 pt-4" />
                <h3 className="flex items-center gap-2 font-display text-h4 text-arctic"><Truck className="h-4 w-4 text-steel-300" /> Envios y pagos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="IVA (%)" value={settings.business.taxRate.toString()} onChange={(v) => update('business', 'taxRate', Number(v))} type="number" />
                  <Field label="Costo envio base (Gs.)" value={settings.business.shippingBase.toString()} onChange={(v) => update('business', 'shippingBase', Number(v))} type="number" />
                  <Field label="Envio gratis desde (Gs.)" value={settings.business.freeShippingThreshold.toString()} onChange={(v) => update('business', 'freeShippingThreshold', Number(v))} type="number" />
                  <Field label="Moneda" value={settings.business.currency} onChange={(v) => update('business', 'currency', v)} />
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Bell className="h-5 w-5 text-yellow-bright" /> Notificaciones</h2>
              <div className="space-y-4">
                <Field label="Email del administrador" value={settings.notifications.adminEmail} onChange={(v) => update('notifications', 'adminEmail', v)} />
                <Toggle label="Email al recibir nuevo pedido" checked={settings.notifications.emailOnNewOrder} onChange={(v) => update('notifications', 'emailOnNewOrder', v)} />
                <Toggle label="Email al recibir nuevo lead" checked={settings.notifications.emailOnNewLead} onChange={(v) => update('notifications', 'emailOnNewLead', v)} />
                <Toggle label="WhatsApp al recibir nuevo pedido" checked={settings.notifications.whatsappOnNewOrder} onChange={(v) => update('notifications', 'whatsappOnNewOrder', v)} />
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === 'seo' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><SearchIcon className="h-5 w-5 text-blue-bright" /> SEO y Analytics</h2>
              <div className="space-y-4">
                <Field label="Meta titulo" value={settings.seo.metaTitle} onChange={(v) => update('seo', 'metaTitle', v)} />
                <div>
                  <label className="label mb-1.5 block">Meta descripcion</label>
                  <textarea
                    value={settings.seo.metaDescription}
                    onChange={(e) => update('seo', 'metaDescription', e.target.value)}
                    className="input min-h-[80px] resize-y"
                    rows={3}
                  />
                  <p className="mt-1 font-mono text-[0.6rem] text-steel-700">{settings.seo.metaDescription.length}/160 caracteres</p>
                </div>
                <Field label="OG Image URL" value={settings.seo.ogImage} onChange={(v) => update('seo', 'ogImage', v)} placeholder="https://..." />
                <Field label="Google Analytics ID" value={settings.seo.googleAnalyticsId} onChange={(v) => update('seo', 'googleAnalyticsId', v)} placeholder="G-XXXXXXXXXX" />
                <Field label="Meta Pixel ID" value={settings.seo.metaPixelId} onChange={(v) => update('seo', 'metaPixelId', v)} placeholder="000000000000000" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUBCOMPONENTS
   ============================================================ */

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="label mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors hover:bg-steel-900/30">
      <span className="font-body text-body-sm text-arctic">{label}</span>
      <div className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-blue' : 'bg-steel-700'}`} onClick={() => onChange(!checked)}>
        <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-arctic transition-transform shadow ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </label>
  );
}
