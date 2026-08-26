import { createRoot } from 'react-dom/client';
import 'antd/dist/antd.css'; // antd v4 global stylesheet — MUST load before styled-components styles
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// NOTE: intentionally NOT wrapped in <React.StrictMode>.
// antd v4.24 (rc-* internals: Table, Tooltip, Dropdown, Steps) call ReactDOM.findDOMNode;
// React 18 StrictMode double-invokes render/effects and breaks/warns on them.
// Removing StrictMode is the sanctioned mitigation for the mandated antd v4 stack (Risk #1).
createRoot(container).render(<App />);
