import { Component } from 'inferno'
import { format } from 'date-fns'

export default class ImportErrors extends Component {
  constructor (props) {
    super(props)

    this.state = {
      lastUpdate: null,
      success: true,
      loading: true,
      importErrors: []
    }

    this.fetchData = this.fetchData.bind(this)
  }

  fetchData () {
    window.fetch('api/import-errors')
      .then(r => r.status === 200 ? r : new Error())
      .then(r => r.json())
      .then(r => this.setState({
        lastUpdate: new Date(r.lastUpdate),
        nextUpdate: new Date(r.nextUpdate),
        loading: false,
        success: true,
        updating: r.status === 'UPDATING_LOGS',
        importErrors: r.log
      }))
      .catch(() => this.setState({
        success: false,
        loading: false
      }))
      .then(() => {
        setTimeout(this.fetchData, 20000)
      })
  }

  componentDidMount () {
    this.fetchData()
  }

  render () {
    const lastUpdate = this.state.lastUpdate
    const nextUpdate = this.state.nextUpdate

    return (
      <div>
        <p className='builds__header'>
          <span className='builds__header__error'>
            {
              this.state.updating && (
                'Updating logs just now...'
              )
            }
            {
              !this.state.success && (
                'Error trying to update. See the backend logs for more information'
              )
            }
          </span>
          <span class='builds__header__time'>
            {
              lastUpdate && (
                <div>
                  <span>Last update: </span>
                  <time className='number'>{format(lastUpdate, 'YYYY-MM-DD HH:mm:ss')}</time>
                </div>
              )
            }
            {
              nextUpdate && (
                <div>
                  <span>Next Update: </span>
                  <time className='number'>{format(nextUpdate, 'YYYY-MM-DD HH:mm:ss')}</time>
                </div>
              )
            }
          </span>
        </p>
        <table className='table'>
          <thead>
            <tr>
              <th>sis_import_id</th>
              <th>file</th>
              <th>message</th>
              <th>row</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.importErrors.map(({sisImportId, file, message, row}) => (
                <tr>
                  <td>{sisImportId}</td>
                  <td>{file}</td>
                  <td>{message}</td>
                  <td>{row}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    )
  }
}
