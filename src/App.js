import React, { useState } from 'react'
import { fetchWeather } from './api/fetchWeather';

const App = () => {
  const [cityName, setCityName] = useState('');
  const [weatherData, setWeatherData] = useState(null)
  const [error, setError] = useState(null)

  const fetchData = async (e) => {
    if(e.key === 'Enter'){
      try {
        const { data } = await fetchWeather(cityName)
        console.log(data);
        setWeatherData(data)
        setCityName('')
        setError(null)
      } catch (error) {
        setError(error.message)
      }
    }
  }


  return (
    <div>
      <input type="text" placeholder='Enter city name...' value={cityName} onChange={(e) => setCityName(e.target.value)} onKeyDown={fetchData} />

      {error && <div style={{color: 'red'}}> {error} </div>}

      {weatherData?.location && (
        <div>
          <h2>
            {weatherData.location.name}, {weatherData.location.region},  {weatherData.location.country}
          </h2>
          <p>
            Lat: {weatherData.location?.lat} °C
            Lon: {weatherData.location?.lon} °F
          </p>
          <p>
            Temperature: {weatherData.current?.temp_c} C
            Temperature: {weatherData.current?.temp_f} F
          </p>
          <p> Condition: {weatherData.current?.condition?.text}</p>
          <img src={weatherData.current?.condition?.icon} alt={weatherData.current?.condition?.icon} />
          <p>Humidity: {weatherData.current?.humidity}</p>
          <p>Pressure: {weatherData.current?.pressure_mb}</p>
        </div>
      )}
    </div>
  );
}

export default App