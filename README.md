# GameScore

Una red social para calificar videojuegos, al estilo Letterboxd: puntúa los juegos que jugaste (de ½ a 5 estrellas), escribe reseñas, arma tu top 5, elige tus géneros favoritos y descubre el ranking de la comunidad.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | ASP.NET Core 10 Web API, EF Core 10, ASP.NET Identity + JWT |
| Base de datos | PostgreSQL (Neon, plan gratuito) |
| Datos de juegos | [RAWG API](https://rawg.io/apidocs) |
| Frontend | React 19 + TypeScript + Vite + React Router |
| Docs de la API | OpenAPI + Scalar (`/scalar` en desarrollo) |

## Estructura

```
GameScore/
├── GameScore.sln                 ← abrir en Rider
├── src/GameScore.Api/            ← backend
│   ├── Controllers/              ← endpoints REST
│   ├── Data/                     ← DbContext + configuraciones Fluent API
│   ├── Dtos/                     ← objetos que viajan al frontend
│   ├── Entities/                 ← modelo de datos
│   ├── Rawg/                     ← cliente de la API de RAWG
│   └── Services/                 ← lógica (juegos, ranking, tokens)
└── client/                       ← frontend React
    └── src/
        ├── api/                  ← cliente HTTP y tipos
        ├── components/
        ├── pages/
        └── index.css             ← tema (colores en :root)
```

## Modelo de datos

- **AppUser** (Identity) — nombre visible, bio, avatar.
- **Game** — copia local de un juego de RAWG (se guarda la primera vez que alguien lo abre o califica, y se refresca cada 7 días).
- **Genre** y **GameGenres** — géneros (muchos a muchos con juegos).
- **Rating** — puntaje 0.5–5 + reseña opcional. Único por (usuario, juego).
- **TopGame** — top 5 del perfil, PK (usuario, posición).
- **UserFavoriteGenre** — géneros favoritos del usuario.

## Ranking

El ranking usa un **promedio bayesiano** (igual que el Top 250 de IMDb):

```
puntaje = (v / (v + m)) · R + (m / (v + m)) · C
```

`R` = promedio del juego, `v` = cantidad de calificaciones, `C` = promedio global, `m` = `Ranking:MinVotes` (3 por defecto).
Un juego con una sola nota de 5 no supera a uno con veinte notas de 4.5.

## Puesta en marcha

### Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- Node.js 20 o superior
- Herramienta de EF Core: `dotnet tool install --global dotnet-ef`

### 1. Base de datos (Neon)

1. Crea una cuenta gratis en [neon.com](https://neon.com) y un proyecto llamado `gamescore`.
2. En **Connect**, copia la cadena de conexión en formato .NET (o la URL `postgresql://…`).
   El formato que espera Npgsql es:
   ```
   Host=ep-xxxx.us-east-2.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=xxxx;SSL Mode=Require
   ```

### 2. API key de RAWG

Regístrate en [rawg.io/apidocs](https://rawg.io/apidocs) y copia tu API key.

### 3. Secretos (nunca van al repositorio)

Desde la carpeta `src/GameScore.Api`:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Host=...;Database=...;Username=...;Password=...;SSL Mode=Require"
dotnet user-secrets set "Rawg:ApiKey" "tu-api-key"
```

En Rider también puedes hacerlo con clic derecho en el proyecto → **Tools → .NET User Secrets**.

### 4. Crear la base de datos

```bash
cd src/GameScore.Api
dotnet ef migrations add InitialCreate
dotnet ef database update
```

(En desarrollo, la API también aplica las migraciones pendientes al iniciar.)

### 5. Ejecutar

- **Backend**: en Rider, ejecuta la configuración `GameScore.Api: http`. Abre `http://localhost:5080/scalar` para probar los endpoints.
- **Frontend**:
  ```bash
  cd client
  npm install
  npm run dev
  ```
  Abre `http://localhost:5173`. Vite redirige `/api` al backend, así que ambos deben estar corriendo.

> Para ver la carpeta `client` dentro de Rider: clic derecho en la solución → **Add → Attach Existing Folder…** → `client`.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión (usuario o correo) |
| GET | `/api/auth/me` | Usuario actual 🔒 |
| GET | `/api/games/search?q=` | Buscar juegos en RAWG |
| GET | `/api/games/popular` | Populares recientes |
| GET | `/api/games/ranking?genre=` | Ranking de la comunidad |
| GET | `/api/games/{rawgId}` | Ficha, promedio, distribución y reseñas |
| PUT | `/api/games/{rawgId}/rating` | Calificar / editar calificación 🔒 |
| DELETE | `/api/games/{rawgId}/rating` | Quitar calificación 🔒 |
| GET | `/api/activity` | Últimas calificaciones de la comunidad |
| GET | `/api/genres` | Géneros |
| GET | `/api/users/{userName}` | Perfil público |
| PUT | `/api/me/profile` | Editar perfil 🔒 |
| PUT | `/api/me/top-games` | Guardar top 5 🔒 |
| PUT | `/api/me/favorite-genres` | Guardar géneros favoritos 🔒 |

🔒 = requiere token JWT (`Authorization: Bearer …`).

## Personalizar colores

Todo el tema está en las variables de `client/src/index.css` (bloque `:root`). Cambiando `--bg`, `--primary` y `--gradient` cambia el look completo.

---

Datos de videojuegos proporcionados por [RAWG](https://rawg.io).
