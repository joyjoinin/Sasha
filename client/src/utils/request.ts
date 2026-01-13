// src/utils/request.ts
import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { getToken, removeToken } from "./auth";

// 1. 定义后端返回的业务数据格式（code/msg/data）
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 2. 定义 Axios 响应类型（泛型 T 为业务数据的 data 类型）
type AxiosResponseWithApi<T = any> = AxiosResponse<ApiResponse<T>>;

// 3. 创建 Axios 实例（初始化 headers 避免 undefined）
const request = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

// 4. 请求拦截器（正确类型：InternalAxiosRequestConfig）
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // 返回 InternalAxiosRequestConfig，符合要求
  },
  (error: AxiosError<ApiResponse>) => {
    // 错误拦截：返回 AxiosError（符合 Axios 要求）
    return Promise.reject(error);
  }
);

// 5. 响应拦截器（关键修复：返回 AxiosResponse，而非直接返回 data）
request.interceptors.response.use(
  (response: AxiosResponseWithApi) => {
    // 仅处理业务逻辑（如 Token 过期可在这里判断），不修改返回类型
    return response; // 返回 AxiosResponseWithApi（AxiosResponse 子类），符合要求
  },
  (error: AxiosError<ApiResponse>) => {
    // Token 过期处理（401 状态码）
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
      alert("登录已过期，请重新登录");
    }
    // 返回 AxiosError，符合拦截器要求
    return Promise.reject(error);
  }
);

// 6. 封装请求函数（提取 data，返回业务数据 ApiResponse，兼顾便捷性）
export const requestWithType = {
  get: async <T = any>(
    url: string,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    // 发起请求，获取 AxiosResponseWithApi
    const response: AxiosResponseWithApi<T> = await request.get(url, config);
    // 提取业务数据返回（简化前端使用，无需每次都取 .data）
    return response.data;
  },
  post: async <T = any>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponseWithApi<T> = await request.post(
      url,
      data,
      config
    );
    return response.data; // 提取业务数据返回
  },
  // 其他方法（put/delete）同理
  put: async <T = any>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponseWithApi<T> = await request.put(
      url,
      data,
      config
    );
    return response.data;
  },
  delete: async <T = any>(
    url: string,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response: AxiosResponseWithApi<T> = await request.delete(url, config);
    return response.data;
  },
};

export default requestWithType;
