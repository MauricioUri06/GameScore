import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { GameCard, GameGridSkeleton } from '../components/GameCard'
import { RankingList } from '../components/RankingList'
import { Empty, ErrorMessage, Spinner } from '../components/Status'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n/LanguageContext'

/** Inicio: top 10 de la comunidad y juegos populares. */
export function HomePage() {
  const { t } = useLang()
  const ranking = useAsync(() => api.ranking(10), [])
  const popular = useAsync(() => api.popularGames(48), [])

  return (
    <div className="container page">
      <h1>{t('Top 10 de la comunidad', 'Community top 10')}</h1>
      <p className="muted page-intro">
        {t('Los juegos mejor calificados en GameScore.', 'The highest rated games on GameScore.')}{' '}
        <Link to="/ranking">{t('Ver el ranking completo →', 'See the full ranking →')}</Link>
      </p>

      <div style={{ marginTop: 28 }}>
        {ranking.error ? (
          <ErrorMessage error={ranking.error} />
        ) : ranking.loading ? (
          <Spinner />
        ) : !ranking.data?.length ? (
          <Empty>
            {t('Todavía no hay juegos calificados.', 'No games have been rated yet.')}{' '}
            <Link to="/juegos">{t('Explora los juegos', 'Browse the games')}</Link>{' '}
            {t('y califica el primero.', 'and rate the first one.')}
          </Empty>
        ) : (
          <RankingList games={ranking.data} />
        )}
      </div>

      <section className="section">
        <div className="section-header">
          <h2>{t('Populares ahora', 'Popular now')}</h2>
          <Link to="/juegos" className="small">
            {t('Ver todos los juegos →', 'See all games →')}
          </Link>
        </div>
        {popular.error ? (
          <ErrorMessage error={popular.error} />
        ) : popular.loading ? (
          <GameGridSkeleton count={12} />
        ) : (
          <div className="game-grid">{popular.data?.map((g) => <GameCard key={g.gameId} game={g} />)}</div>
        )}
      </section>
    </div>
  )
}
