import request from './request';

/**
 * 游戏得分历史记录
 */
export const getGameTop = (data: any) => {
  return request('/game/getGameTop', {
    method: 'get',
    data,
  });
};

/**
 * 游戏得分上传
 */
export const digital = (data: any) => {
  return request('/game/digital', {
    method: 'post',
    data,
  });
};
