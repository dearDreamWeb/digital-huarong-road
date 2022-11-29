import { useState, useEffect } from 'react';
import styles from './App.module.less';
import routes from '../config/routes';
import { renderRoutes } from 'react-router-config';
import 'antd/dist/reset.css';

function App() {
  return <div className={styles.app}>{renderRoutes(routes)}</div>;
}

export default App;
