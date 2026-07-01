# Guía de contribución

Gracias por tu interés en colaborar con SOSC. Este es un proyecto privado;
las contribuciones se aceptan únicamente desde miembros autorizados del equipo.

## Flujo de trabajo

1. **Crear una rama** desde `main` con prefijo según el tipo:
   - `feat/nombre-corto` para nuevas funcionalidades
   - `fix/nombre-corto` para bugs
   - `refactor/nombre-corto` para reestructuras
   - `docs/nombre-corto` para documentación
   - `chore/nombre-corto` para mantenimiento

2. **Commits** siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(tickets): agregar filtro por equipo asignado
   fix(equipment): corregir cálculo de próximo mantenimiento
   docs(deploy): actualizar guía de SSL en VPS
   ```

3. **Antes de pushear** verificá localmente:
   ```bash
   cd frontend && npx tsc --noEmit && npm run lint && npm run build
   cd ../backend && python -m compileall -q app
   ```

4. **Pull Request** con:
   - Título descriptivo (mismo formato que commits)
   - Descripción del qué y el porqué
   - Screenshots/GIFs si afecta UI
   - Checklist completado (ver plantilla)

5. **Merge** solo cuando:
   - El CI esté en verde ✓
   - Al menos una review aprobada (si aplica)
   - No haya conflictos con `main`

## Setup local

Ver [README.md](./README.md#inicio-rápido) y [docs/DEPLOY.md](./docs/DEPLOY.md).

## Estilo de código

- **TypeScript / React**: Prettier + ESLint (configs en `frontend/`).
  Componentes funcionales con hooks. Sin `any` salvo cuando esté justificado.
- **Python**: ruff + estilo PEP 8. Nombres en `snake_case`.
- **Comentarios**: solo cuando expliquen el *por qué*, no el *qué*.

## Reportes de bugs y features

Usá las plantillas de Issue en GitHub.

## Seguridad

Si encontrás una vulnerabilidad, **NO abras un issue público**. Escribí a
riverosgr@gmail.com con el detalle.
