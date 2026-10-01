export const getAccessToken = () => localStorage.getItem("token");

export const setAccessToken = (accessToken: string) => {
  localStorage.setItem("token", accessToken);
};

export const clearSession = () => {
  localStorage.removeItem("token");
};
