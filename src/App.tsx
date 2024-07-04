import { useState, useEffect } from 'react';
import styles from './App.module.less';
import routes from '../config/routes';
import { renderRoutes } from 'react-router-config';
import 'antd/dist/reset.css';

/**屏幕分辨率比 */
export const RATE = screen.width / 1920;

function App() {
  document.documentElement.style.setProperty('--rate', RATE.toString());
  return <div className={styles.app}>{renderRoutes(routes)}</div>;
}

export default App;
