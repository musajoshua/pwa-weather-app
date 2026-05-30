import React, { useEffect, useState } from "react";
import { fetchWeather } from "./api/fetchWeather";
import {
  enqueueSearch,
  getPendingSearches,
  removePendingSearch,
} from "./syncQueue";

const RECENT_SEARCH_KEY = "recent-search-key";
const TEMP_UNIT_KEY = "temp-unit-key";

const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY)) || [];
  } catch {
    return [];
  }
};

const getTempUnit = () => localStorage.getItem(TEMP_UNIT_KEY) || "C";

const App = () => {
  const [cityName, setCityName] = useState("");
  const [tempUnit, setTempUnit] = useState(getTempUnit);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem(TEMP_UNIT_KEY, tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    let isDraining = false;

    const drain = async () => {
      if (isDraining || !navigator.onLine) return;
      isDraining = true;
      try {
        const pending = await getPendingSearches();
        for (const item of pending) {
          try {
            const { data } = await fetchWeather(item.query);
            setWeatherData(data);
            setRecentSearches((prev) => [item.query, ...prev]);
            setError(null);
          } catch (err) {
            setError(`Could not drain ${item.query} ${err.message}`);
          } finally {
            await removePendingSearch(item.id);
            setPendingCount((c) => Math.max(0, c - 1));
          }
        }
      } finally {
        isDraining = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") drain();
    };

    getPendingSearches()
      .then((items) => setPendingCount(items.length))
      .catch(() => {});
    drain();

    window.addEventListener("online", drain);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("online", drain);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await fetchWeather(
            `${coords.latitude},${coords.longitude}`,
          );
          setWeatherData(data);
        } catch (err) {
          setError(err.message);
        }
      },
      (err) => setError(err.message),
    );
  }, []);

  const queueOfflineSearch = async (query) => {
    await enqueueSearch(query);
    setPendingCount((c) => c + 1);
  };

  const loadWeather = async (query, { remember = false } = {}) => {
    if (!navigator.onLine) {
      await queueOfflineSearch(query);
      setError(null);
      return;
    }

    try {
      const { data } = await fetchWeather(query);
      setWeatherData(data);
      setError(null);
      if (remember) setRecentSearches((prev) => [query, ...prev]);
    } catch (err) {
      if (err.message === "Network Error") {
        await queueOfflineSearch(query);
        setError(null);
      } else {
        setError(err.message);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || !cityName.trim()) return;
    loadWeather(cityName, { remember: true });
    setCityName("");
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Enter city name..."
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div>
          <button onClick={() => setTempUnit(tempUnit === "C" ? "F" : "C")}>
            Toggle unit to {tempUnit === "C" ? "F" : "C"}
          </button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div style={{ color: "orange" }}>
          {pendingCount} search{pendingCount > 1 ? "es" : ""} queued (offline)
        </div>
      )}

      {recentSearches.length > 0 && (
        <>
          <p>Recent Search</p>
          <ul>
            {recentSearches.map((recentSearch, i) => (
              <li key={`${recentSearch}-${i}`}>
                {recentSearch}:{" "}
                <button onClick={() => loadWeather(recentSearch)}>
                  View Information
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {error && <div style={{ color: "red" }}>{error}</div>}

      {weatherData?.location && (
        <div>
          <h2>
            {weatherData.location.name}, {weatherData.location.region},{" "}
            {weatherData.location.country}
          </h2>
          <p>
            Lat: {weatherData.location.lat}, Lon: {weatherData.location.lon}
          </p>
          <p>
            Temperature:{" "}
            {tempUnit === "C"
              ? `${weatherData.current.temp_c}°C`
              : `${weatherData.current.temp_f}°F`}
          </p>
          <p>Condition: {weatherData.current?.condition?.text}</p>
          <img
            src={weatherData.current?.condition?.icon}
            alt={weatherData.current?.condition?.text}
          />
          <p>Humidity: {weatherData.current?.humidity}</p>
          <p>Pressure: {weatherData.current?.pressure_mb}</p>
        </div>
      )}
    </div>
  );
};

export default App;
