import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Eres un redactor profesional de e-commerce especializado en ferreteria, construccion, herramientas industriales y materiales de obra. Tu trabajo es crear descripciones de producto optimizadas para venta online.

REGLAS:
- Escribe SIEMPRE en español (Paraguay/Latinoamérica)
- Tono profesional pero accesible, tecnico cuando corresponde
- Resalta beneficios sobre características
- Incluye usos prácticos y aplicaciones reales
- Usa palabras clave naturales para SEO
- NO uses emojis
- NO inventes especificaciones tecnicas que no te hayan dado
- Si no tienes datos suficientes, trabaja con lo que tienes sin inventar

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
{
  "shortDescription": "Descripcion corta optimizada (max 155 caracteres, ideal para SEO meta description y listados)",
  "description": "Descripcion completa de 3-5 parrafos. Primer parrafo: beneficio principal y uso. Segundo parrafo: caracteristicas clave. Tercer parrafo: aplicaciones y para quien es. Separar parrafos con doble salto de linea.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

function buildUserPrompt(data: {
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  tags: string[];
  price: string;
}): string {
  let prompt = `Genera descripciones optimizadas para este producto:\n\n`;
  prompt += `PRODUCTO: ${data.name}\n`;
  if (data.brand) prompt += `MARCA: ${data.brand}\n`;
  if (data.category) prompt += `CATEGORIA: ${data.category}\n`;
  if (data.price) prompt += `PRECIO: Gs. ${Number(data.price).toLocaleString('es-PY')}\n`;

  if (data.shortDescription) {
    prompt += `\nDESCRIPCION ACTUAL DEL ADMIN (mejorar esta):\n${data.shortDescription}\n`;
  }

  if (data.description) {
    prompt += `\nDESCRIPCION LARGA ACTUAL:\n${data.description}\n`;
  }

  if (data.specifications && Object.keys(data.specifications).length > 0) {
    prompt += `\nESPECIFICACIONES TECNICAS:\n`;
    for (const [key, val] of Object.entries(data.specifications)) {
      prompt += `- ${key}: ${val}\n`;
    }
  }

  if (data.tags && data.tags.length > 0) {
    prompt += `\nETIQUETAS ACTUALES: ${data.tags.join(', ')}\n`;
  }

  prompt += `\nGenera el JSON con shortDescription, description y tags mejorados.`;
  return prompt;
}

// Fallback inteligente cuando no hay API key
function generateFallbackDescription(data: {
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  tags: string[];
}) {
  const brandText = data.brand ? ` ${data.brand}` : '';
  const catText = data.category || 'ferreteria';

  // Short description
  const shortParts = [];
  if (data.shortDescription) {
    shortParts.push(data.shortDescription.replace(/\.+$/, ''));
  } else {
    shortParts.push(`${data.name}${brandText}`);
  }
  if (data.brand && !shortParts[0].includes(data.brand)) {
    shortParts[0] += ` de ${data.brand}`;
  }
  const shortDescription = (shortParts[0] + '. Calidad profesional con garantia. Envio a todo el pais.').slice(0, 155);

  // Specs text
  const specsEntries = Object.entries(data.specifications || {});
  const specsText = specsEntries.length > 0
    ? `Especificaciones principales: ${specsEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}.`
    : '';

  // Full description
  const descParagraphs = [
    `${data.name}${brandText} — la solucion profesional para tus proyectos de ${catText.toLowerCase()}. Disenado para ofrecer rendimiento superior y durabilidad en condiciones exigentes de trabajo.`,
    specsText
      ? `Cuenta con caracteristicas tecnicas destacadas. ${specsText} Cada detalle esta pensado para maximizar tu productividad y garantizar resultados de calidad.`
      : `Fabricado con materiales de primera calidad y acabados industriales. Cada detalle esta pensado para maximizar tu productividad y garantizar resultados profesionales.`,
    `Ideal para profesionales de la construccion, mantenimiento industrial y talleres. Tambien perfecto para el entusiasta del bricolaje que busca herramientas de nivel profesional.`,
  ];

  if (data.description) {
    descParagraphs[0] = data.description.split('\n')[0] || descParagraphs[0];
  }

  // Tags
  const baseTags = [
    data.name.split(' ')[0]?.toLowerCase(),
    data.brand?.toLowerCase(),
    data.category?.toLowerCase(),
    'profesional',
    'calidad',
  ].filter(Boolean);
  const existingTags = data.tags || [];
  const allTags = [...new Set([...existingTags, ...baseTags])].slice(0, 8);

  return {
    shortDescription,
    description: descParagraphs.join('\n\n'),
    tags: allTags,
    source: 'template' as const,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del producto es obligatorio para generar descripciones' },
        { status: 400 }
      );
    }

    // If we have an OpenAI key, use the AI
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-YOUR-KEY-HERE') {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildUserPrompt(body) },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
          }),
        });

        if (!openaiRes.ok) {
          const errData = await openaiRes.json().catch(() => ({}));
          console.error('OpenAI API error:', errData);
          // Fall through to template fallback
          throw new Error('OpenAI API error');
        }

        const aiData = await openaiRes.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) throw new Error('No content from AI');

        const parsed = JSON.parse(content);

        return NextResponse.json({
          shortDescription: parsed.shortDescription || '',
          description: parsed.description || '',
          tags: parsed.tags || [],
          source: 'ai',
        });
      } catch (aiError) {
        console.error('AI generation failed, using template fallback:', aiError);
        // Falls through to template
      }
    }

    // Template-based fallback
    const result = generateFallbackDescription(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al generar descripciones' },
      { status: 500 }
    );
  }
}
