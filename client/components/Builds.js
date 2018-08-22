import { Component } from 'inferno'
import { format } from 'date-fns'
import BuildCard from './BuildCard'

export default class Builds extends Component {
  constructor (props) {
    super(props)

    this.state = {
      lastUpdate: null,
      success: true,
      loading: true,
      builds: [
        'lms-api',
        'lms-sync-users',
        'lms-sync-courses',
        'lms-export-results',
        'social'
      ].map(r => ({name: r}))
    }

    this.fetchData = this.fetchData.bind(this)
  }

  fetchData () {
    window.fetch('api')
      .then(r => r.status === 200 ? r : new Error())
      .then(r => r.json())
      .then(builds => this.setState({
        lastUpdate: new Date(),
        loading: false,
        success: true,
        builds
      }))
      .catch(() => this.setState({
        success: false,
        loading: false
      }))
      .then(() => {
        setTimeout(this.fetchData, 10000)
      })
  }

  componentDidMount () {
    this.fetchData()
  }

  render () {
    const lastUpdate = this.state.lastUpdate

    return (
      <div>
        <p className='builds__header'>
          <span className="builds__header__error">
            {
              !this.state.success && (
                'Error trying to update. See the backend logs for more information'
              )
            }
          </span>
          <span class="builds__header__time">{lastUpdate && ('Last Update: ' + format(lastUpdate, 'HH:mm:ss'))}</span>
        </p>
        <div>
          {
            this.state.builds.map(({name, color, url}) => (
              <BuildCard
                loading={this.state.loading}
                key={name}
                name={name}
                color={color}
                url={url}
              />
            ))
          }
        </div>
      </div>
    )
  }
}
