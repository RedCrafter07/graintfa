import { createRoot } from 'react-dom/client';
import App from './App';
import { getElement, getRegisteredElements, registerElement } from './elements';
import * as elements from './elements/defaultElements';

// api setup (TBD: Plugins: get a custom copy of the api and remove the globals)
(globalThis as any).__graintfa_api = {
    registerElement,
    getElement,
    getRegisteredElements,
};

for (const [id, element] of Object.entries(elements)) {
    registerElement(id, element);
}

createRoot(document.getElementById('root')!).render(<App />);
