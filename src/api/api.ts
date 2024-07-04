import request from './request';

/**
 * 游戏得分历史记录
 */
export const getGameTop = (data: any) => {
  return request('/v1/game/getGameTop', {
    method: 'get',
    data,
  });
};

/**
 * 游戏得分历史记录聚合
 */
export const getGameTopV2 = (data: any) => {
  return request('/v2/game/getGameTopV2', {
    method: 'get',
    data,
  });
};

/**
 * 游戏得分上传
 */
export const digital = (data: any) => {
  return request('/v1/game/addGameHistory', {
    method: 'post',
    data,
  });
};

/**
 * 今天的记录
 */
export const getGameTodayHistory = (data: any) => {
  return request('/v1/game/getGameTodayHistory', {
    method: 'get',
    data,
  }) as Promise<any>;
};
