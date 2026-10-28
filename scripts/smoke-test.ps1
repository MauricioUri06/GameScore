# Prueba de punta a punta de la API de GameScore contra la base de Neon.
# Uso (con la API corriendo en http://localhost:5080):
#   powershell -ExecutionPolicy Bypass -File scripts\smoke-test.ps1
param([string]$Base = "http://localhost:5080/api")

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "MMddHHmmss"
$user = "prueba$stamp"
$pass = "prueba123"

function Step($name, [scriptblock]$action) {
    try {
        $result = & $action
        Write-Host "[OK]   $name" -ForegroundColor Green
        return $result
    } catch {
        Write-Host "[FAIL] $name -> $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) { Write-Host "       $($_.ErrorDetails.Message)" -ForegroundColor DarkRed }
        exit 1
    }
}

# 1. Escritura en Neon: crear usuario (tabla AspNetUsers)
$auth = Step "Registro de usuario '$user' (INSERT en Neon)" {
    Invoke-RestMethod "$Base/auth/register" -Method Post -ContentType "application/json" `
        -Body (@{ userName = $user; email = "$user@example.com"; password = $pass } | ConvertTo-Json)
}

# 2. Lectura en Neon: login con el usuario recién creado
$login = Step "Login (SELECT en Neon)" {
    Invoke-RestMethod "$Base/auth/login" -Method Post -ContentType "application/json" `
        -Body (@{ userNameOrEmail = $user; password = $pass } | ConvertTo-Json)
}
$headers = @{ Authorization = "Bearer $($login.token)" }

$me = Step "GET /auth/me con el token JWT" { Invoke-RestMethod "$Base/auth/me" -Headers $headers }
Write-Host "       usuario: $($me.userName) ($($me.id))"

# 3. IGDB + escritura de géneros en Neon
$genres = Step "GET /genres (IGDB -> tabla Genres)" { Invoke-RestMethod "$Base/genres" }
Write-Host "       géneros en la BD: $($genres.Count)"

# 4. Búsqueda en IGDB
$results = Step "Buscar 'hollow knight' en IGDB" { Invoke-RestMethod "$Base/games/search?q=hollow%20knight" }
$game = $results[0]
Write-Host "       primer resultado: $($game.name) (gameId $($game.gameId))"

# 5. Calificar: guarda el juego (Games/GameGenres) y la calificación (Ratings) en Neon
Step "Calificar con 4.5 estrellas (INSERT en Ratings)" {
    Invoke-RestMethod "$Base/games/$($game.gameId)/rating" -Method Put -Headers $headers -ContentType "application/json" `
        -Body (@{ score = 4.5; review = "Prueba automática" } | ConvertTo-Json)
} | Out-Null

# 6. Releer desde Neon
$detail = Step "Ficha del juego (promedio leído de Neon)" { Invoke-RestMethod "$Base/games/$($game.gameId)" -Headers $headers }
Write-Host "       promedio: $($detail.averageScore)  calificaciones: $($detail.ratingsCount)  mi nota: $($detail.myRating.score)"

$ranking = Step "Ranking (GROUP BY en Neon)" { Invoke-RestMethod "$Base/games/ranking?limit=5" }
Write-Host "       #1: $($ranking[0].name) ($($ranking[0].averageScore))"

Step "Top 5 del perfil" {
    Invoke-RestMethod "$Base/me/top-games" -Method Put -Headers $headers -ContentType "application/json" `
        -Body (@{ gameIds = @($game.gameId) } | ConvertTo-Json)
} | Out-Null

$profile = Step "Perfil público /users/$user" { Invoke-RestMethod "$Base/users/$user" }
Write-Host "       top 1: $($profile.topGames[0].name)  calificaciones: $($profile.ratingsCount)"

Write-Host ""
Write-Host "Todo OK: la API lee y escribe en Neon." -ForegroundColor Cyan
