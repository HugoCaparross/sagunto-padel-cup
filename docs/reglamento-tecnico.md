# Reglamento técnico — cupos y grupos

## Cupo por categoría

- Mínimo: **3 parejas por categoría** (`MIN_PAREJAS_CATEGORIA`).
- Máximo: **12 parejas por categoría** (`MAX_PAREJAS_POR_CATEGORIA`), límite admitido por el formato de grupos.
- Plazas totales por prueba: `plazas_maximas`, con valor predeterminado 24. Este límite se aplica a la prueba en conjunto.

## Tamaños de grupo

La función `tamanosGrupos` acepta los siguientes tamaños:

| Parejas | Tamaños de grupo |
|---:|:---|
| 3 | [3] |
| 4 | [4] |
| 5 | [5] |
| 6 | [3, 3] |
| 7 | [4, 3] |
| 8 | [4, 4] |
| 9 | [5, 4] |
| 10 | [5, 5] |
| 11 | [6, 5] |
| 12 | [6, 6] |

Hasta 5 parejas se juega en un grupo. Desde 6 parejas se organizan dos grupos. Los grupos de 3 disputan doble vuelta; los demás, vuelta simple.

> **Pendiente de confirmación por la organización: si el tope es por prueba, por categoría o ambos.**
