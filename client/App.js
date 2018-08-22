/**
 * Root component of the Application.
 */
import Inferno from 'inferno'
import Builds from './components/Builds'

const App = () => (
  <section>
    <h1>Builds monitor</h1>
    <Builds />
  </section>
)

export default App
