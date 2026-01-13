// src/utils/auth.ts：Token存储与管理
export const TOKEN_KEY = "admin_access_token";
export const EXPIRES_IN_KEY = "token_expires_in"; // Token有效期（秒）

// 存储Token和有效期
export const setToken = (token: string, expiresIn: number) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_IN_KEY, expiresIn.toString());
  // 记录Token生成时间（用于前端计算剩余有效期）
  localStorage.setItem("token_create_time", Date.now().toString());
};

// 获取Token
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// 清除Token（登出时调用）
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_IN_KEY);
  localStorage.removeItem("token_create_time");
};

// 检查Token是否存在且未过期（前端预校验）
export const isTokenValid = (): boolean => {
  const token = getToken();
  const createTime = localStorage.getItem("token_create_time");
  const expiresIn = localStorage.getItem(EXPIRES_IN_KEY);

  if (!token || !createTime || !expiresIn) return false;

  // 计算Token已存活时间（秒）
  const now = Date.now();
  const aliveTime = Math.floor((now - Number(createTime)) / 1000);
  // 剩余有效期 > 60秒则视为有效（避免临界值）
  return aliveTime < Number(expiresIn) - 60;
};
