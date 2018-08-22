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
      .then(importErrors => this.setState({
        lastUpdate: new Date(),
        loading: false,
        success: true,
        importErrors
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
