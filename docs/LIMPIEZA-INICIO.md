# Limpieza del sistema — por dónde empezar

Objetivo: reducir superficie, duplicación y módulos no deseados sin romper tickets, clientes y flujo principal.

## Fase 0 — Control de versiones

- [x] Revisar `git status` en la raíz de `fullsistem`.
- [x] Commitear cambios y mantener `main` alineado con `origin/main` tras cada bloque (push cuando corresponda).
- [ ] Antes de refactors grandes adicionales: valorar `git stash` o rama de trabajo si hay trabajo en curso mezclado.

## Fase 1 — Inventario y criterio

- [x] Marcar módulos **obligatorios** (ej. tickets, clients, admin básico).
- [x] **SCM y WMS** marcados como no deseados y **eliminados del código frontend** (ver `docs/MODULOS-FULLSISTEM.md`).
- [ ] Marcar otros módulos opcionales / demo (ej. PLM, CMMS según negocio) y documentar decisión en issue si aplica.

## Fase 2 — Ocultar sin borrar (reversible)

- [ ] Variables `import.meta.env.VITE_*` por módulo, leídas en `Layout.tsx` y `App.tsx`.
- [ ] O un solo `VITE_DISABLED_MODULES=...` parseado en runtime.

> **Nota:** Para SCM/WMS no se usó esta fase; se aplicó eliminación directa (Fase 3).

## Fase 3 — Eliminar módulo por completo (irreversible)

**SCM y WMS — hecho (referencia para futuros retiros):**

1. Quitar `<Route path="scm" …>` y `<Route path="wms" …>` de `App.tsx`.
2. Quitar ítems del menú en `Layout.tsx` (`navigationStructure`).
3. Quitar tarjetas / enlaces en `Dashboard.tsx` y bloques en `integrationService.getSystemKPIs`.
4. Quitar claves de `MODULES` y permisos en plantillas de roles en `permissionService.ts`.
5. Eliminar `pages/SCM.tsx`, `pages/WMS.tsx`, `services/scm.ts`, `services/wms.ts`.
6. Ejecutar `npm run build` en `frontend/` y pruebas manuales (login, tickets, inventario).

**Por cada nuevo módulo a retirar:** repetir la misma lista y actualizar esta documentación.

## Referencia de mapa

Ver `docs/MODULOS-FULLSISTEM.md` para la lista actualizada de rutas y RBAC.
