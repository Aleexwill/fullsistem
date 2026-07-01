import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/portfolio-store';

export async function GET(req: NextRequest) {
  try {
    let projects = getAllProjects();
    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active');
    if (active === 'true') projects = projects.filter((p) => p.isActive);
    const cat = searchParams.get('category');
    if (cat) projects = projects.filter((p) => p.category === cat);
    projects.sort((a, b) => a.order - b.order);
    return NextResponse.json({ projects, total: projects.length });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) return NextResponse.json({ error: 'Titulo obligatorio' }, { status: 400 });
    const project = createProject({
      title: body.title, description: body.description || '', category: body.category || 'civil',
      location: body.location || '', duration: body.duration || '', year: body.year || new Date().getFullYear().toString(),
      client: body.client || '', image: body.image || '', gallery: body.gallery || [],
      badge: body.badge || 'blue', size: body.size || 'small', isActive: body.isActive !== false,
      isFeatured: Boolean(body.isFeatured), order: body.order || 0,
    });
    return NextResponse.json(project, { status: 201 });
  } catch { return NextResponse.json({ error: 'Error al crear' }, { status: 500 }); }
}
