import Inferno from 'inferno'

const BuildCard = ({name, color, url}) => (
  <div className='build'>
    <div className={`build__status build__status--${color}`}></div>
    <div className='build__name'>
      <a href={url} target='_blank'>{name}</a>
    </div>
  </div>
)

export default BuildCard
