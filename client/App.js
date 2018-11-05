/**
 * Root component of the Application.
 */
import Inferno from 'inferno' // eslint-disable-line
import Builds from './components/Builds'
import ImportErrors from './components/ImportErrors'

const App = () => (
  <div>
    <section className='monitor-section'>
      <h1>Builds monitor</h1>
      <Builds />
    </section>
    <section className='monitor-section'>
      <h1>Canvas Import Errors</h1>
      <ImportErrors />
    </section>
  </div>
)

export default App
