import Inferno from 'inferno' // eslint-disable-line

const BuildCard = ({name, color, url}) => (
  <div className='build'>
    <div className={`build__status build__status--${color}`} />
    <div className='build__name'>
      <a href={url} target='_blank'>{name}</a>
    </div>
  </div>
)

export default BuildCard
