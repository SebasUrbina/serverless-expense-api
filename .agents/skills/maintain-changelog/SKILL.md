---
name: maintain-changelog
description: Maintain this monorepo's CHANGELOG.md alongside user-facing changes, API contract changes, and release preparation. Excludes internal changes with no meaningful user or API-consumer impact.
---

# Maintain Changelog

Mantener un único `CHANGELOG.md` en la raíz para Web y API, siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## Durante la implementación

- Leer el changelog y el diff de la tarea. Documentar únicamente cambios implementados y verificados dentro del alcance; no incorporar trabajo ajeno ni inferir funcionalidades a partir de nombres de commits.
- Actualizar el changelog en el mismo PR que el cambio relevante, bajo `## [Unreleased]`, al principio del historial. Crear esta sección si falta.
- Conservar el idioma y formato del archivo existente. Usar `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed` o `Security`, incluyendo solo categorías con contenido.
- Redactar cada entrada según su efecto observable y su utilidad para usuarios o consumidores de la API. Usar `Web:` o `API:` cuando aclare el alcance y enlazar el PR si se conoce su URL real.
- Consolidar entradas del mismo cambio; no copiar el registro de commits ni agregar una nota por cada archivo o ajuste intermedio.
- Omitir refactors internos, formato, tests y documentación para colaboradores cuando no cambien el comportamiento relevante. Esta omisión también aplica al mantenimiento de esta skill.
- Para cambios incompatibles, indicar qué deja de funcionar y qué acción requiere la migración. Documentar requisitos operativos necesarios para usar la nueva versión cuando correspondan.

Ejemplo de redacción para una corrección, solo si está implementada:

```markdown
### Fixed

- Web: se corrige el total mensual al filtrar los gastos por categoría.
```

## Al preparar una versión

- Preparar una versión solo dentro de una tarea de release autorizada; actualizar notas no autoriza publicar, desplegar, crear tags ni cambiar versiones de paquetes.
- Confirmar qué cambios forman parte de la versión. Mover sus entradas a `## [X.Y.Z] - YYYY-MM-DD`, usando la versión y fecha reales de publicación; mantener las versiones más recientes arriba y conservar `Unreleased`.
- Respetar el esquema de versiones del proyecto. Explicar las migraciones de cambios incompatibles y conservar el historial publicado salvo correcciones verificables.
- Conventional Commits puede ayudar a obtener un borrador, pero revisar las notas para que describan el resultado final y no dupliquen cambios.

## Verificación

Revisar el diff del changelog: entradas respaldadas por el trabajo realizado, sin duplicados ni categorías vacías; cambios pendientes dentro de `Unreleased` y enlaces existentes válidos. Para cambios solo de documentación, basta revisar el diff y su formato; no ejecutar suites de aplicación sin otro motivo.
