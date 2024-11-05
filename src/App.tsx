import { useState, useEffect } from 'react';
import styles from './App.module.less';
import routes from '../config/routes';
import { renderRoutes } from 'react-router-config';
import 'antd/dist/reset.css';
import Welcome from './components/welcome/welcome';

/**屏幕分辨率比 */
export const RATE = screen.width / 1920;

function App() {
  const [isOpen, setIsOpen] = useState(!!localStorage.getItem('isInit'));
  document.documentElement.style.fontSize = `${RATE * 100}px`;

  const closeMask = () => {
    localStorage.setItem('isInit', 'true');
    setIsOpen(true);
  };

  return (
    <div className={styles.app}>
      {renderRoutes(routes)}
      {!isOpen && <Welcome closeMask={closeMask}></Welcome>}
    </div>
  );
}

export default App;
