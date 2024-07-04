import { getGameTodayHistory } from '@/api/api';
import { useEffect, useRef, useState } from 'react';

export const useTodayHistory = () => {
  const [historyList, setHistoryList] = useState([]);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getTodayHistoryList();
  }, []);

  const loopQuery = () => {
    timer.current && clearTimeout(timer.current);
    timer.current = null;
    timer.current = setTimeout(() => {
      getTodayHistoryList();
    }, 1000 * 60 * 2);
  };

  const getTodayHistoryList = async () => {
    try {
      const res = await getGameTodayHistory({
        gameName: 'digitalHuarongRoad',
        page: 1,
        pageSize: 10000,
      });
      if (!res.success) {
        return;
      }
      setHistoryList(res?.data?.result || []);
    } catch (error) {
      console.error(error);
      setHistoryList([]);
    }
    loopQuery();
  };

  return { historyList, getTodayHistoryList };
};
