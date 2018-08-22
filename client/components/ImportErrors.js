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
    window.fetch('/api/import-errors')
      .then(r => r.status === 200 ? r : new Error())
      .then(r => r.json())
      .then(r => this.setState({
        lastUpdate: new Date(r.lastUpdate),
        nextUpdate: new Date(r.nextUpdate),
        loading: false,
        success: true,
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
          <span className="builds__header__error">
            {
              !this.state.success && (
                'Error trying to update. See the backend logs for more information'
              )
            }
          </span>
          <span class="builds__header__time">
            <div>{lastUpdate && ('Last Update: ' + format(lastUpdate, 'YYYY-MM-DD HH:mm:ss'))}</div>
            <div>{nextUpdate && ('Next Update: ' + format(nextUpdate, 'YYYY-MM-DD HH:mm:ss'))}</div>
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
              this.state.importErrors.map(({sis_import_id, file, message, row}) => (
                <tr>
                  <td>{sis_import_id}</td>
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
