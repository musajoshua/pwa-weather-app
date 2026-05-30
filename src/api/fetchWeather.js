import axios from "axios";

const URL = "https://api.weatherapi.com/v1/current.json";
const API_KEY = "796c78b7d0734c398a275455263005";

export const fetchWeather = (cityName) => {
  return axios.get(URL, {
    params: {
      q: cityName,
      key: API_KEY,
    },
  });
};
