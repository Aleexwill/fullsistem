'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Phone, Mail, MapPin, Clock, MessageCircle, Send, ChevronRight,
  CheckCircle, Facebook, Instagram, Linkedin, Calculator, ShoppingCart, Wrench,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

const subjectsGeneral = [
  'Informacion de la empresa',
  'Reclamo o sugerencia',
  'Otro',
];

const subjectsEcommerce = [
  'Consulta sobre producto',
  'Estado de mi pedido',
  'Devolucion o cambio',
  'Disponibilidad de producto',
];

const subjectsServicios = [
  'Presupuesto de mantenimiento',
  'Presupuesto de obra civil',
  'Presupuesto metalurgica',
  'Consulta sobre servicios',
];

type FormType = 'general' | 'ecommerce' | 'servicios';

export default function ContactoPage() {
  const searchParams = useSearchParams();

  const tipoParam = searchParams.get('tipo');
  const servicioParam = searchParams.get('servicio');
  const categoriaParam = searchParams.get('categoria');

  const initialType: FormType = tipoParam === 'presupuesto' ? 'servicios' : tipoParam === 'ecommerce' ? 'ecommerce' : 'general';

  const [formType, setFormType] = useState<FormType>(initialType);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', address: '',
    subject: servicioParam ? `Presupuesto de ${servicioParam.toLowerCase()}` : '',
    message: servicioParam ? `Hola, me interesa solicitar un presupuesto para el servicio de ${servicioParam}.` : '',
    serviceTitle: servicioParam || '',
    serviceType: categoriaParam || '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (tipoParam === 'presupuesto') setFormType('servicios');
    else if (tipoParam === 'ecommerce') setFormType('ecommerce');
  }, [tipoParam]);

  const whatsappUrl = formatWhatsAppUrl(siteConfig.whatsapp, 'Hola, quiero comunicarme con ustedes.');

  const getSubjects = () => {
    switch (formType) {
      case 'ecommerce': return subjectsEcommerce;
      case 'servicios': return subjectsServicios;
      default: return subjectsGeneral;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      if (formType === 'servicios') {
        // Create a presupuesto (budget request)
        const res = await fetch('/api/presupuestos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: formData.name, email: formData.email, phone: formData.phone, company: formData.company, address: formData.address },
            serviceTitle: formData.serviceTitle || formData.subject,
            serviceType: formData.serviceType || 'otro',
            description: formData.message,
            priority: 'media',
            source: 'formulario_web',
          }),
        });
        if (!res.ok) throw new Error('Error');
      } else {
        // Create a lead (for ecommerce or general)
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: formData.name, email: formData.email, phone: formData.phone },
            subject: formData.subject || 'Consulta general',
            message: formData.message,
            source: 'contact_form',
            priority: 'medium',
            serviceInterest: formData.subject,
            leadType: formType,
          }),
        });
        if (!res.ok) throw new Error('Error');
      }
      setSubmitted(true);
    } catch {
      alert('Error al enviar el formulario. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const typeConfig: Record<FormType, { label: string; icon: any; color: string; bg: string; desc: string }> = {
    general: { label: 'General', icon: Mail, color: 'text-blue-bright', bg: 'bg-blue-muted', desc: 'Consultas generales, informacion, sugerencias' },
    ecommerce: { label: 'E-Commerce', icon: ShoppingCart, color: 'text-[#48BB78]', bg: 'bg-success-light', desc: 'Productos, pedidos, disponibilidad, cambios' },
    servicios: { label: 'Servicios', icon: Wrench, color: 'text-yellow-bright', bg: 'bg-yellow-muted', desc: 'Presupuestos, cotizaciones, consultas de servicios' },
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-steel-900/40">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-steel-500">
          <Link href="/" className="hover:text-arctic">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-arctic">Contacto</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-steel-900/40 bg-gradient-hero py-16">
        <div className="container-main">
          <span className="overline mb-2 block">Hablemos</span>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold uppercase leading-[0.95] text-arctic">
            Contacto
          </h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-6 max-w-lg font-body text-body-lg text-steel-300">
            Escribinos y te respondemos en menos de 24 horas. Tambien podes llamarnos o visitarnos en nuestra oficina.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container-main">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
            {/* Form — 3 cols */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="card p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                    <CheckCircle className="h-8 w-8 text-[#48BB78]" />
                  </div>
                  <h2 className="font-display text-h2 text-arctic">
                    {formType === 'servicios' ? 'Solicitud de presupuesto enviada!' : 'Mensaje enviado!'}
                  </h2>
                  <p className="mt-3 font-body text-body text-steel-300">
                    {formType === 'servicios'
                      ? 'Recibimos tu solicitud de presupuesto. Nuestro equipo la revisara y te contactara con una cotizacion.'
                      : 'Recibimos tu consulta. Te responderemos en menos de 24 horas al email que nos indicaste.'}
                  </p>
                  <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', company: '', address: '', subject: '', message: '', serviceTitle: '', serviceType: '' }); }} className="btn-secondary mt-6">Enviar otro mensaje</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card p-6 md:p-8">
                  {/* Type selector */}
                  <div className="mb-6">
                    <h2 className="mb-3 font-display text-h2 text-arctic">Tipo de consulta</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(typeConfig) as [FormType, typeof typeConfig[FormType]][]).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <button key={key} type="button" onClick={() => setFormType(key)}
                            className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${formType === key ? `border-${cfg.color.replace('text-', '')} ${cfg.bg} ring-1 ring-${cfg.color.replace('text-', '')}` : 'border-steel-900/40 bg-carbon hover:border-steel-700'}`}>
                            <Icon className={`h-5 w-5 ${formType === key ? cfg.color : 'text-steel-500'}`} />
                            <span className={`font-body text-caption font-medium ${formType === key ? 'text-arctic' : 'text-steel-300'}`}>{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 font-body text-caption text-steel-500">{typeConfig[formType].desc}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div><label className="label mb-1.5 block">Nombre *</label><input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Tu nombre completo" className="input" /></div>
                    <div><label className="label mb-1.5 block">Email *</label><input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="tu@email.com" className="input" /></div>
                    <div><label className="label mb-1.5 block">Telefono</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0971 123 456" className="input" /></div>
                    {formType === 'servicios' ? (
                      <div><label className="label mb-1.5 block">Empresa</label><input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Tu empresa (opcional)" className="input" /></div>
                    ) : (
                      <div><label className="label mb-1.5 block">Asunto *</label><select name="subject" required value={formData.subject} onChange={handleChange} className="input"><option value="">Seleccionar...</option>{getSubjects().map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                    )}
                  </div>

                  {formType === 'servicios' && (
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div><label className="label mb-1.5 block">Servicio solicitado *</label><input type="text" name="serviceTitle" required value={formData.serviceTitle} onChange={handleChange} placeholder="Ej: Instalacion electrica, obra civil..." className="input" /></div>
                      <div><label className="label mb-1.5 block">Tipo de servicio</label>
                        <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="input">
                          <option value="">Seleccionar...</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="civil">Construccion civil</option>
                          <option value="metalurgica">Metalurgica</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2"><label className="label mb-1.5 block">Direccion</label><input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Direccion donde se realizara el servicio" className="input" /></div>
                    </div>
                  )}

                  <div className="mt-5">
                    <label className="label mb-1.5 block">{formType === 'servicios' ? 'Descripcion del trabajo *' : 'Mensaje *'}</label>
                    <textarea name="message" required rows={5} value={formData.message} onChange={handleChange} placeholder={formType === 'servicios' ? 'Describe el trabajo que necesitas, dimensiones, materiales, plazos...' : 'Contanos en que podemos ayudarte...'} className="input resize-none" />
                  </div>

                  <button type="submit" disabled={sending} className="btn-primary mt-6 w-full py-4 text-[0.8rem] sm:w-auto">
                    {sending ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-arctic/30 border-t-arctic" />Enviando...</>) : (
                      formType === 'servicios'
                        ? <><Calculator className="h-4 w-4" />Solicitar presupuesto</>
                        : <><Send className="h-4 w-4" />Enviar mensaje</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar info — 2 cols */}
            <div className="space-y-6 lg:col-span-2">
              {/* Contact info card */}
              <div className="card p-6">
                <h3 className="mb-5 font-display text-h3 text-arctic">Informacion de contacto</h3>
                <div className="space-y-4">
                  <a href={`tel:${siteConfig.phone}`} className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-steel-900">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-muted text-blue-bright"><Phone className="h-5 w-5" /></div>
                    <div><div className="label text-steel-300">Telefono</div><div className="mt-0.5 font-body text-body font-medium text-arctic">{siteConfig.phone}</div></div>
                  </a>
                  <a href={`mailto:${siteConfig.email}`} className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-steel-900">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-muted text-blue-bright"><Mail className="h-5 w-5" /></div>
                    <div><div className="label text-steel-300">Email</div><div className="mt-0.5 font-body text-body font-medium text-arctic">{siteConfig.email}</div></div>
                  </a>
                  <div className="flex items-start gap-3 rounded-md p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-muted text-blue-bright"><MapPin className="h-5 w-5" /></div>
                    <div><div className="label text-steel-300">Direccion</div><div className="mt-0.5 font-body text-body font-medium text-arctic">{siteConfig.address.street}</div><div className="font-body text-body-sm text-steel-300">{siteConfig.address.city}, {siteConfig.address.state}</div></div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-muted text-blue-bright"><Clock className="h-5 w-5" /></div>
                    <div><div className="label text-steel-300">Horarios</div><div className="mt-0.5 font-body text-body font-medium text-arctic">{siteConfig.openingHours}</div></div>
                  </div>
                </div>
              </div>

              {/* WhatsApp card */}
              <div className="card overflow-hidden">
                <div className="bg-[#25D366]/10 p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]"><MessageCircle className="h-5 w-5 text-white" /></div>
                    <div><h3 className="font-display text-h4 text-arctic">Escribinos por WhatsApp</h3><p className="font-body text-caption text-steel-300">Respuesta rapida</p></div>
                  </div>
                  <p className="mb-4 font-body text-body-sm text-steel-300">Consultanos directamente por WhatsApp para una respuesta inmediata.</p>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full"><MessageCircle className="h-4 w-4" />Iniciar chat</a>
                </div>
              </div>

              {/* Social */}
              <div className="card p-6">
                <h3 className="mb-4 font-display text-h4 text-arctic">Seguinos en redes</h3>
                <div className="flex gap-3">
                  <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-lg bg-steel-900 text-steel-300 transition-colors hover:bg-blue-muted hover:text-blue-bright"><Facebook className="h-5 w-5" /></a>
                  <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-lg bg-steel-900 text-steel-300 transition-colors hover:bg-blue-muted hover:text-blue-bright"><Instagram className="h-5 w-5" /></a>
                  <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-lg bg-steel-900 text-steel-300 transition-colors hover:bg-blue-muted hover:text-blue-bright"><Linkedin className="h-5 w-5" /></a>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="card overflow-hidden">
                <div className="flex h-48 items-center justify-center bg-steel-900">
                  <div className="text-center"><MapPin className="mx-auto h-8 w-8 text-steel-500" /><p className="mt-2 font-body text-body-sm text-steel-500">Mapa interactivo</p><p className="font-body text-caption text-steel-700">Google Maps se integrara aqui</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
