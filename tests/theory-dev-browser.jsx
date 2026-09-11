import { createRoot } from 'react-dom/client';
import { FixtureAuthContext } from './fixtures/solved-auth';
import App from '../src/App';
import '../src/index.css';
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<FixtureAuthContext.Provider value={{ user: null, profile: null, loading: false }}><App /><label className="block p-4 text-sm">Verificare clipboard (fixture)<textarea aria-label="Verificare clipboard" className="block h-24 w-full border bg-background" /></label></FixtureAuthContext.Provider>);
