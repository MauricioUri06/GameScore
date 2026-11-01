import type { Medal } from '../api/types'
import type { Lang } from './lang'

// Textos que llegan del servidor en español (géneros, medallas, errores) y su versión en inglés.
// Si algo no está aquí, se muestra tal cual llegó.

/** Géneros y temáticas: nombre en español (como los guarda el servidor) → inglés. */
const GENRES_EN: Record<string, string> = {
  'Point & click': 'Point & click',
  Lucha: 'Fighting',
  'Disparos (shooter)': 'Shooter',
  'Música y ritmo': 'Music & rhythm',
  Plataformas: 'Platform',
  Puzles: 'Puzzle',
  Carreras: 'Racing',
  'Estrategia en tiempo real': 'Real-time strategy',
  'Rol (RPG)': 'Role-playing (RPG)',
  Simulación: 'Simulator',
  Deportes: 'Sport',
  Estrategia: 'Strategy',
  'Estrategia por turnos': 'Turn-based strategy',
  Táctico: 'Tactical',
  "Hack and slash / Beat 'em up": "Hack and slash / Beat 'em up",
  'Preguntas y trivia': 'Quiz & trivia',
  Pinball: 'Pinball',
  Aventura: 'Adventure',
  Indie: 'Indie',
  Arcade: 'Arcade',
  'Novela visual': 'Visual novel',
  'Cartas y tablero': 'Card & board game',
  MOBA: 'MOBA',
  Acción: 'Action',
  Fantasía: 'Fantasy',
  'Ciencia ficción': 'Science fiction',
  Terror: 'Horror',
  Suspenso: 'Thriller',
  Supervivencia: 'Survival',
  Histórico: 'Historical',
  Sigilo: 'Stealth',
  Comedia: 'Comedy',
  'Gestión y negocios': 'Business',
  Drama: 'Drama',
  'No ficción': 'Non-fiction',
  Sandbox: 'Sandbox',
  Educativo: 'Educational',
  Infantil: 'Kids',
  'Mundo abierto': 'Open world',
  Bélico: 'Warfare',
  'Party / fiesta': 'Party',
  '4X': '4X',
  Misterio: 'Mystery',
  Romance: 'Romance',
}

export const genreName = (name: string, lang: Lang) => (lang === 'en' ? (GENRES_EN[name] ?? name) : name)

/** Medallas por id: [nombre, descripción] en inglés. */
const MEDALS_EN: Record<string, [string, string]> = {
  'review-1': ['First review', 'Write your first review.'],
  'review-10': ['Rising critic', 'Write 10 reviews.'],
  'review-50': ['Critic', 'Write 50 reviews.'],
  'review-100': ['Legendary critic', 'Write 100 reviews.'],
  'rating-1': ['First game', 'Rate your first game.'],
  'rating-25': ['Dedicated player', 'Rate 25 games.'],
  'rating-100': ['Collector', 'Rate 100 games.'],
  'rating-250': ['Legend', 'Rate 250 games.'],
  'likes-1': ['First like', 'Get a like on a review.'],
  'likes-10': ['Respected voice', 'Get 10 likes on your reviews.'],
  'likes-50': ['Influencer', 'Get 50 likes on your reviews.'],
  'likes-100': ['Community icon', 'Get 100 likes on your reviews.'],
  'votes-10': ['Jury', 'Like or dislike 10 reviews.'],
  'days-7': ['Newcomer', 'Spend a week on GameScore.'],
  'days-30': ['Regular', 'Spend a month on GameScore.'],
  'days-180': ['Veteran', 'Spend six months on GameScore.'],
  'days-365': ['A year of gaming', 'Spend a year on GameScore.'],
  'genre-horror': ['Survivor', 'Rate 5 horror games.'],
  'genre-rpg': ['RPG soul', 'Rate 5 role-playing games.'],
  'genre-shooter': ['Trigger happy', 'Rate 5 shooters.'],
  'genre-platform': ['Jumper', 'Rate 5 platformers.'],
  'genre-adventure': ['Adventurer', 'Rate 5 adventure games.'],
  'genre-strategy': ['Strategist', 'Rate 5 strategy games.'],
  'genre-fighting': ['Fighter', 'Rate 5 fighting games.'],
  'genre-racing': ['Racer', 'Rate 5 racing games.'],
  'genre-sport': ['Athlete', 'Rate 5 sports games.'],
  'genre-puzzle': ['Mastermind', 'Rate 5 puzzle games.'],
  'genre-indie': ['Indie heart', 'Rate 5 indie games.'],
  'genre-variety': ['Eclectic', 'Rate games from 10 different genres.'],
  'consoles-3': ['Multiplatform', 'Rate games played on 3 different consoles.'],
  'retro-5': ['Archaeologist', 'Rate 5 games released before 2000.'],
  'zero-1': ['Ruthless', 'Give a game 0 stars.'],
  'five-10': ['Generous heart', 'Give 5 stars to 10 games.'],
  'profile-complete': ['Complete profile', 'Have a profile picture, a full top 5, favorite genres and consoles.'],
  'playing-1': ['In game', 'Add a game to "Playing now".'],
  'finished-1': ['End credits', 'Mark a game as finished.'],
  'finished-10': ['Completionist', 'Finish 10 games.'],
  'finished-25': ['Controller legend', 'Finish 25 games.'],
  'older-10': ['Historian', 'Get 10 correct answers in a row in Older/Newer.'],
  'older-25': ['Gaming chronicler', 'Get 25 correct answers in a row in Older/Newer.'],
  'cover-400': ['Good eye', 'Score 400 points in one game of Guess the Cover.'],
  'cover-800': ['Eagle eye', 'Score 800 points in one game of Guess the Cover.'],
  'category-1': ['Walking encyclopedia', 'Reach 1000 points in Categories.'],
  'category-5': ['Know-it-all', 'Reach 1000 points in Categories 5 times.'],
}

export function medalText(medal: Medal, lang: Lang): { name: string; description: string } {
  const en = lang === 'en' ? MEDALS_EN[medal.id] : undefined
  return en ? { name: en[0], description: en[1] } : { name: medal.name, description: medal.description }
}

const MEDAL_CATEGORIES_EN: Record<string, string> = {
  Reseñas: 'Reviews',
  Calificaciones: 'Ratings',
  Comunidad: 'Community',
  Géneros: 'Genres',
  Antigüedad: 'Membership',
  Especiales: 'Special',
}

export const medalCategory = (category: string, lang: Lang) =>
  lang === 'en' ? (MEDAL_CATEGORIES_EN[category] ?? category) : category

/** Familias de consolas. */
export const platformFamily = (family: string, lang: Lang) => (lang === 'en' && family === 'Otras' ? 'Other' : family)

/** Mensajes de error del servidor (fijos) → inglés. */
const ERRORS_EN: Record<string, string> = {
  'Nickname o clave incorrectos.': 'Wrong nickname or PIN.',
  'Ese nickname ya está en uso.': 'That nickname is already taken.',
  'El nickname no es válido.': 'That nickname is not valid.',
  'La clave debe tener 6 dígitos.': 'The PIN must have 6 digits.',
  'La clave debe tener solo números.': 'The PIN must contain only numbers.',
  'No llegó ninguna imagen.': 'No image was received.',
  'La imagen es muy pesada (máximo 1 MB).': 'The image is too large (max 1 MB).',
  'El archivo no es una imagen JPG, PNG o WebP.': 'The file is not a JPG, PNG or WebP image.',
  'No hay categorías disponibles.': 'No categories available.',
  'Esta ronda ya terminó.': 'This round is already over.',
  'No existe ese juego.': "That game doesn't exist.",
  'La partida ya terminó.': 'The game is already over.',
  'Esta partida ya terminó.': 'This game is already over.',
  'No hay juegos disponibles para jugar.': 'No games available to play.',
  'El puntaje debe ir en pasos de 0.5.': 'The score must go in steps of 0.5.',
  'Solo puedes mostrar medallas que ya obtuviste.': 'You can only show medals you have earned.',
  'Escribe algo en el diario.': 'Write something in the journal.',
  'Máximo 5 juegos y sin repetir.': 'Up to 5 games, no repeats.',
  'El voto debe ser 1, -1 o 0.': 'The vote must be 1, -1 or 0.',
  'No puedes votar tu propia reseña.': "You can't vote on your own review.",
  'No se pudo obtener información de juegos.': "Couldn't get game information.",
  'IGDB está limitando las consultas (máx. 4 por segundo). Intenta de nuevo.':
    'IGDB is rate limiting requests (max 4 per second). Try again.',
  'Necesitas iniciar sesión.': 'You need to log in.',
  'No se pudo conectar con el servidor. ¿Está corriendo la API?': "Couldn't connect to the server. Is the API running?",
  'Ocurrió un error inesperado.': 'An unexpected error occurred.',
  'Escribe tu nickname.': 'Enter your nickname.',
}

export function serverError(message: string, lang: Lang): string {
  if (lang !== 'en') return message
  const fixed = ERRORS_EN[message]
  if (fixed) return fixed
  const max = /^Máximo (\d+) juegos en "Jugando ahora"\.$/.exec(message)
  if (max) return `Up to ${max[1]} games in "Playing now".`
  const missing = /^No existe el juego (\d+)\.$/.exec(message)
  if (missing) return `Game ${missing[1]} doesn't exist.`
  return message
}
