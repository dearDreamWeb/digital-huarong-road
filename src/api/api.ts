import request from './request';

/**
 * 登录
 */
export const login = (data: any) => {
  return request('/user/login', {
    method: 'post',
    data,
  });
};

/**
 * 注册
 */
export const register = (data: any) => {
  return request('/user/register', {
    method: 'post',
    data,
  });
};

/**
 * 游戏得分上传
 */
export const createGame = (data: any) => {
  return request('/game/create', {
    method: 'post',
    data,
  });
};
