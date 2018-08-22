/**
 * Entry point of the client-side JS code.
 *
 * Renders the entire Inferno tree into "#root" HTML Element
 */
import Inferno, {render} from 'inferno'
import App from './App'

render(<App />, document.querySelector('#root'))
