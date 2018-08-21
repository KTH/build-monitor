/**
 * Entry point of the client-side JS code.
 *
 * Renders the entire Inferno tree into "#root" HTML Element
 */
import Inferno, {render} from 'inferno'

const App = () => (
  <div>Hello Inferno!!!!</div>
)

render(<App />, document.querySelector('#root'))
