export type LoginRequest = {
  email: string;
  password: string;
}

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  image: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string
}

export interface Location {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}