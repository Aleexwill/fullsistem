'use client';

import { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Copy,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Tag,
  FileText,
  MessageSquare,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface AISuggestion {
  shortDescription: string;
  description: string;
  tags: string[];
  source: 'ai' | 'template';
}

interface AIAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  productContext: {
    name: string;
    brand: string;
    category: string;
    shortDescription: string;
    description: string;
    specifications: Record<string, string>;
    tags: string[];
    price: string;
  };
  onApply: (fields: {
    shortDescription?: string;
    description?: string;
    tags?: string[];
  }) => void;
}

export default function AIAssistModal({
  isOpen,
  onClose,
  productContext,
  onApply,
}: AIAssistModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  // Which fields the user has selected to apply
  const [selected, setSelected] = useState({
    shortDescription: true,
    description: true,
    tags: true,
  });

  const generate = async () => {
    setLoading(true);
    setError('');
    setSuggestion(null);

    try {
      const res = await fetch('/api/ai/mejorar-descripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productContext),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al generar');
      }

      const data: AISuggestion = await res.json();
      setSuggestion(data);
      setSelected({ shortDescription: true, description: true, tags: true });
    } catch (err: any) {
      setError(err.message || 'Error al generar descripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;
    const fields: { shortDescription?: string; description?: string; tags?: string[] } = {};
    if (selected.shortDescription) fields.shortDescription = suggestion.shortDescription;
    if (selected.description) fields.description = suggestion.description;
    if (selected.tags) fields.tags = suggestion.tags;
    onApply(fields);
    onClose();
  };

  const toggleField = (field: keyof typeof selected) => {
    setSelected((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  const hasMinimumContext = productContext.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-carbon/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-muted to-blue/20">
              <Sparkles className="h-5 w-5 text-blue-bright" />
            </div>
            <div>
              <h2 className="font-display text-h3 text-arctic">Asistente IA</h2>
              <p className="font-body text-caption text-steel-500">
                Genera descripciones optimizadas para tu producto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-5">
          {/* Context summary */}
          <div className="mb-5 rounded-md border border-steel-900/40 bg-carbon p-4">
            <p className="mb-2 font-body text-caption uppercase tracking-[0.06em] text-steel-500">
              Contexto del producto
            </p>
            <div className="grid grid-cols-2 gap-2 text-body-sm">
              <div>
                <span className="text-steel-500">Nombre: </span>
                <span className="font-medium text-arctic">{productContext.name || '—'}</span>
              </div>
              <div>
                <span className="text-steel-500">Marca: </span>
                <span className="text-arctic">{productContext.brand || '—'}</span>
              </div>
              <div>
                <span className="text-steel-500">Categoria: </span>
                <span className="text-arctic">{productContext.category || '—'}</span>
              </div>
              <div>
                <span className="text-steel-500">Specs: </span>
                <span className="text-arctic">
                  {Object.keys(productContext.specifications).length} atributos
                </span>
              </div>
              {productContext.shortDescription && (
                <div className="col-span-2">
                  <span className="text-steel-500">Desc. actual: </span>
                  <span className="text-steel-300 italic">
                    &quot;{productContext.shortDescription.slice(0, 80)}
                    {productContext.shortDescription.length > 80 ? '...' : ''}&quot;
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* No context warning */}
          {!hasMinimumContext && (
            <div className="alert-warning mb-5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Necesitas al menos el nombre del producto</p>
                <p className="mt-0.5 text-caption text-steel-300">
                  Cuanta mas informacion agregues (marca, categoria, specs, descripcion corta),
                  mejor sera el resultado generado.
                </p>
              </div>
            </div>
          )}

          {/* Generate button */}
          {!suggestion && !loading && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-muted">
                <Cpu className="h-8 w-8 text-blue-bright" />
              </div>
              <p className="mb-2 font-display text-h3 text-arctic">
                {productContext.shortDescription
                  ? 'Listo para mejorar'
                  : 'Listo para generar'}
              </p>
              <p className="mb-6 max-w-md text-center font-body text-body-sm text-steel-500">
                {productContext.shortDescription
                  ? 'La IA tomara tu descripcion actual y la optimizara para maximizar las conversiones en tu tienda.'
                  : 'La IA analizara los datos del producto y generara descripciones profesionales optimizadas para SEO y conversiones.'}
              </p>
              <button
                onClick={generate}
                disabled={!hasMinimumContext}
                className="btn-primary gap-2 px-8 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {productContext.shortDescription
                  ? 'Mejorar descripcion'
                  : 'Generar descripciones'}
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-12">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-2 border-blue-muted" />
                <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-blue-bright" />
              </div>
              <p className="mt-4 font-display text-h4 text-arctic">Generando contenido...</p>
              <p className="mt-1 font-body text-caption text-steel-500">
                Analizando producto y optimizando para e-commerce
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert-danger mb-5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{error}</p>
                <button
                  onClick={generate}
                  className="mt-1 font-body text-caption text-blue-bright hover:underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {suggestion && !loading && (
            <div className="space-y-4">
              {/* Source badge */}
              <div className="flex items-center gap-2">
                {suggestion.source === 'ai' ? (
                  <span className="badge-blue flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Generado por IA
                  </span>
                ) : (
                  <span className="badge-yellow flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Generado por plantilla (configura OPENAI_API_KEY para IA completa)
                  </span>
                )}
                <button
                  onClick={generate}
                  className="ml-auto flex items-center gap-1 font-body text-caption text-steel-500 transition-colors hover:text-blue-bright"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerar
                </button>
              </div>

              {/* Short description */}
              <SuggestionCard
                icon={MessageSquare}
                title="Descripcion corta"
                subtitle={`${suggestion.shortDescription.length}/155 caracteres`}
                content={suggestion.shortDescription}
                current={productContext.shortDescription}
                selected={selected.shortDescription}
                onToggle={() => toggleField('shortDescription')}
              />

              {/* Full description */}
              <SuggestionCard
                icon={FileText}
                title="Descripcion completa"
                subtitle={`${suggestion.description.split(' ').length} palabras`}
                content={suggestion.description}
                current={productContext.description}
                selected={selected.description}
                onToggle={() => toggleField('description')}
                multiline
              />

              {/* Tags */}
              <div
                className={`rounded-lg border p-4 transition-all ${
                  selected.tags
                    ? 'border-blue/40 bg-blue-muted/20'
                    : 'border-steel-900/40 bg-carbon opacity-60'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-steel-300" />
                    <span className="font-display text-h4 text-arctic">
                      Etiquetas sugeridas
                    </span>
                    <span className="font-body text-caption text-steel-500">
                      {suggestion.tags.length} tags
                    </span>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <span className="font-body text-caption text-steel-500">
                      {selected.tags ? 'Aplicar' : 'Omitir'}
                    </span>
                    <input
                      type="checkbox"
                      checked={selected.tags}
                      onChange={() => toggleField('tags')}
                      className="h-4 w-4 rounded border-steel-700 bg-steel-900 accent-blue"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestion.tags.map((tag) => (
                    <span key={tag} className="badge-blue">
                      {tag}
                    </span>
                  ))}
                </div>
                {productContext.tags.length > 0 && (
                  <div className="mt-2 border-t border-steel-900/30 pt-2">
                    <p className="mb-1 font-body text-caption text-steel-700">Tags actuales:</p>
                    <div className="flex flex-wrap gap-1">
                      {productContext.tags.map((tag) => (
                        <span key={tag} className="badge-neutral text-[0.55rem]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestion && !loading && (
          <div className="flex items-center justify-between border-t border-steel-900/40 px-6 py-4">
            <p className="font-body text-caption text-steel-500">
              {Object.values(selected).filter(Boolean).length} de 3 campos seleccionados
            </p>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="btn-ghost py-2 text-caption">
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={!Object.values(selected).some(Boolean)}
                className="btn-primary gap-2 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Aplicar seleccionados
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SUBCOMPONENT: SuggestionCard
   ============================================================ */

function SuggestionCard({
  icon: Icon,
  title,
  subtitle,
  content,
  current,
  selected,
  onToggle,
  multiline,
}: {
  icon: any;
  title: string;
  subtitle: string;
  content: string;
  current: string;
  selected: boolean;
  onToggle: () => void;
  multiline?: boolean;
}) {
  const [showCurrent, setShowCurrent] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        selected
          ? 'border-blue/40 bg-blue-muted/20'
          : 'border-steel-900/40 bg-carbon opacity-60'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-steel-300" />
          <span className="font-display text-h4 text-arctic">{title}</span>
          <span className="font-body text-caption text-steel-500">{subtitle}</span>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <span className="font-body text-caption text-steel-500">
            {selected ? 'Aplicar' : 'Omitir'}
          </span>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="h-4 w-4 rounded border-steel-700 bg-steel-900 accent-blue"
          />
        </label>
      </div>

      {/* Generated content */}
      <div
        className={`rounded-md border border-steel-900/30 bg-carbon p-3 font-body text-body-sm text-arctic ${
          multiline ? 'whitespace-pre-line' : ''
        }`}
      >
        {content}
      </div>

      {/* Current content toggle */}
      {current && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="flex items-center gap-1 font-body text-caption text-steel-500 transition-colors hover:text-steel-300"
          >
            <ArrowRight
              className={`h-3 w-3 transition-transform ${showCurrent ? 'rotate-90' : ''}`}
            />
            {showCurrent ? 'Ocultar actual' : 'Comparar con actual'}
          </button>
          {showCurrent && (
            <div className="mt-1.5 rounded-md border border-steel-900/20 bg-steel-900/30 p-3 font-body text-caption text-steel-500 italic">
              {current}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
