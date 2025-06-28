// Weather App JavaScript
class WeatherApp {
    constructor() {
        this.apiKey = "ed43f5d0d5849f986d339158d4d30ccb";
        this.currentUnit = 'metric'; // metric for Celsius, imperial for Fahrenheit
        this.currentTheme = 'light';
        this.currentWeatherData = null;
        this.favoriteLocations = JSON.parse(localStorage.getItem('favoriteLocations')) || [];
        
        this.initializeApp();
        this.bindEvents();
        this.createParticles();
        this.updateDateTime();
        
        // Auto-load weather for user's location or default city
        this.loadInitialWeather();
    }

    initializeApp() {
        // Hide loading screen after initialization
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1500);

        // Set initial theme
        this.setTheme(localStorage.getItem('theme') || 'light');
        
        // Set initial unit
        this.currentUnit = localStorage.getItem('unit') || 'metric';
        this.updateUnitToggle();
    }

    bindEvents() {
        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearchInput(e));

        // Header controls
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('unitToggle').addEventListener('click', () => this.toggleUnit());
        document.getElementById('locationBtn').addEventListener('click', () => this.getCurrentLocation());

        // Update date/time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    async loadInitialWeather() {
        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            await this.getWeatherData(lastCity);
        } else {
            // Try to get user's location, fallback to London
            this.getCurrentLocation();
        }
    }

    async handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const city = searchInput.value.trim();
        
        if (city) {
            await this.getWeatherData(city);
            searchInput.value = '';
            this.hideSuggestions();
        }
    }

    async handleSearchInput(e) {
        const query = e.target.value.trim();
        if (query.length > 2) {
            // In a real app, you'd implement city suggestions here
            // For now, we'll just show a simple suggestion
            this.showSuggestions([query]);
        } else {
            this.hideSuggestions();
        }
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.addEventListener('click', () => {
                document.getElementById('searchInput').value = suggestion;
                this.handleSearch();
            });
            suggestionsContainer.appendChild(item);
        });
        
        suggestionsContainer.style.display = 'block';
    }

    hideSuggestions() {
        document.getElementById('searchSuggestions').style.display = 'none';
    }

    async getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await this.getWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.showAlert('Unable to get your location. Please search for a city manually.', 'warning');
                    // Fallback to London
                    this.getWeatherData('London');
                }
            );
        } else {
            this.showAlert('Geolocation is not supported by this browser.', 'warning');
            this.getWeatherData('London');
        }
    }

    async getWeatherByCoords(lat, lon) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                await this.processWeatherData(data);
                // Also get forecast data
                await this.getForecastByCoords(lat, lon);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Weather API error:', error);
            this.showError();
        }
    }

    async getWeatherData(city) {
        try {
            this.showLoading();
            
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                await this.processWeatherData(data);
                localStorage.setItem('lastCity', city);
                
                // Get forecast data
                await this.getForecastData(city);
                
                // Get additional data (air quality, etc.)
                await this.getAdditionalData(data.coord.lat, data.coord.lon);
                
                this.hideLoading();
                this.hideError();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Weather API error:', error);
            this.hideLoading();
            this.showError();
        }
    }

    async getForecastData(city) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                this.processForecastData(data);
            }
        } catch (error) {
            console.error('Forecast API error:', error);
        }
    }

    async getForecastByCoords(lat, lon) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.currentUnit}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                this.processForecastData(data);
            }
        } catch (error) {
            console.error('Forecast API error:', error);
        }
    }

    async getAdditionalData(lat, lon) {
        // In a real app, you'd get air quality and UV index data
        // For demo purposes, we'll simulate this data
        this.updateAirQuality(Math.floor(Math.random() * 100));
        this.updateUVIndex(Math.floor(Math.random() * 11));
    }

    async processWeatherData(data) {
        this.currentWeatherData = data;
        
        // Update UI elements
        document.getElementById('cityName').textContent = data.name;
        document.getElementById('countryName').textContent = data.sys.country;
        
        const temp = Math.round(data.main.temp);
        const unit = this.currentUnit === 'metric' ? '°C' : '°F';
        document.getElementById('temperature').textContent = `${temp}${unit}`;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}${unit}`;
        
        document.getElementById('description').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed)} ${this.currentUnit === 'metric' ? 'km/h' : 'mph'}`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        
        // Update weather icon
        this.updateWeatherIcon(data.weather[0].main, data.weather[0].icon);
        
        // Update background based on weather
        this.updateBackground(data.weather[0].main, this.isDay(data.sys.sunrise, data.sys.sunset));
        
        // Update sun times
        this.updateSunTimes(data.sys.sunrise, data.sys.sunset);
        
        // Create weather animations
        this.createWeatherAnimation(data.weather[0].main);
    }

    processForecastData(data) {
        this.updateHourlyForecast(data.list.slice(0, 8)); // Next 24 hours (3-hour intervals)
        this.updateDailyForecast(this.processDailyData(data.list));
    }

    processDailyData(hourlyData) {
        const dailyData = {};
        
        hourlyData.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    dt: item.dt
                };
            }
            dailyData[date].temps.push(item.main.temp);
        });
        
        return Object.values(dailyData).slice(0, 5).map(day => ({
            ...day,
            temp_max: Math.max(...day.temps),
            temp_min: Math.min(...day.temps)
        }));
    }

    updateHourlyForecast(hourlyData) {
        const container = document.getElementById('hourlyForecast');
        container.innerHTML = '';
        
        hourlyData.forEach(item => {
            const time = new Date(item.dt * 1000);
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            
            const unit = this.currentUnit === 'metric' ? '°C' : '°F';
            
            hourlyItem.innerHTML = `
                <div class="hourly-time">${time.getHours()}:00</div>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" class="hourly-icon">
                <div class="hourly-temp">${Math.round(item.main.temp)}${unit}</div>
                <div class="hourly-desc">${item.weather[0].main}</div>
            `;
            
            container.appendChild(hourlyItem);
        });
    }

    updateDailyForecast(dailyData) {
        const container = document.getElementById('dailyForecast');
        container.innerHTML = '';
        
        dailyData.forEach((day, index) => {
            const date = new Date(day.dt * 1000);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' });
            
            const dailyItem = document.createElement('div');
            dailyItem.className = 'daily-item';
            
            const unit = this.currentUnit === 'metric' ? '°' : '°F';
            
            dailyItem.innerHTML = `
                <div class="daily-day">${dayName}</div>
                <img src="https://openweathermap.org/img/wn/${day.weather.icon}.png" alt="${day.weather.description}" class="daily-icon">
                <div class="daily-desc">${day.weather.description}</div>
                <div class="daily-temps">
                    <span class="daily-high">${Math.round(day.temp_max)}${unit}</span>
                    <span class="daily-low">${Math.round(day.temp_min)}${unit}</span>
                </div>
            `;
            
            container.appendChild(dailyItem);
        });
    }

    updateWeatherIcon(weatherMain, iconCode) {
        const weatherIcon = document.getElementById('weatherIcon');
        
        // Use OpenWeatherMap icons for better accuracy
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = weatherMain;
    }

    updateBackground(weatherMain, isDay) {
        const root = document.documentElement;
        let gradient;
        
        switch (weatherMain.toLowerCase()) {
            case 'clear':
                gradient = isDay 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
                break;
            case 'clouds':
                gradient = 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)';
                break;
            case 'rain':
            case 'drizzle':
                gradient = 'linear-gradient(135deg, #4b79a1 0%, #283e51 100%)';
                break;
            case 'thunderstorm':
                gradient = 'linear-gradient(135deg, #141e30 0%, #243b55 100%)';
                break;
            case 'snow':
                gradient = 'linear-gradient(135deg, #e6ddd4 0%, #d5d4d0 100%)';
                break;
            case 'mist':
            case 'fog':
                gradient = 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)';
                break;
            default:
                gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        root.style.setProperty('--primary-bg', gradient);
    }

    updateSunTimes(sunrise, sunset) {
        const sunriseTime = new Date(sunrise * 1000);
        const sunsetTime = new Date(sunset * 1000);
        const now = new Date();
        
        document.getElementById('sunrise').textContent = sunriseTime.toLocaleTimeString('en', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('sunset').textContent = sunsetTime.toLocaleTimeString('en', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Update sun indicator position
        const totalDaylight = sunset - sunrise;
        const currentProgress = (now.getTime() / 1000 - sunrise) / totalDaylight;
        const clampedProgress = Math.max(0, Math.min(1, currentProgress));
        
        const sunIndicator = document.getElementById('sunIndicator');
        sunIndicator.style.left = `${clampedProgress * 100}%`;
    }

    updateAirQuality(aqi) {
        document.getElementById('aqiValue').textContent = aqi;
        
        let status, color;
        if (aqi <= 50) {
            status = 'Good';
            color = '#00f5a0';
        } else if (aqi <= 100) {
            status = 'Moderate';
            color = '#ffd700';
        } else if (aqi <= 150) {
            status = 'Unhealthy for Sensitive';
            color = '#ff8c00';
        } else {
            status = 'Unhealthy';
            color = '#ff6b6b';
        }
        
        document.getElementById('aqiStatus').textContent = status;
        document.getElementById('aqiStatus').style.color = color;
        
        const progress = document.getElementById('aqiProgress');
        progress.style.width = `${Math.min(aqi, 200) / 2}%`;
        progress.style.background = color;
    }

    updateUVIndex(uv) {
        document.getElementById('uvValue').textContent = uv;
        
        let status, color;
        if (uv <= 2) {
            status = 'Low';
            color = '#00f5a0';
        } else if (uv <= 5) {
            status = 'Moderate';
            color = '#ffd700';
        } else if (uv <= 7) {
            status = 'High';
            color = '#ff8c00';
        } else if (uv <= 10) {
            status = 'Very High';
            color = '#ff6b6b';
        } else {
            status = 'Extreme';
            color = '#8b00ff';
        }
        
        document.getElementById('uvStatus').textContent = status;
        document.getElementById('uvStatus').style.color = color;
        
        const progress = document.getElementById('uvProgress');
        progress.style.width = `${(uv / 11) * 100}%`;
        progress.style.background = color;
    }

    createWeatherAnimation(weatherMain) {
        const container = document.getElementById('weatherAnimation');
        container.innerHTML = '';
        
        switch (weatherMain.toLowerCase()) {
            case 'rain':
            case 'drizzle':
                this.createRainAnimation(container);
                break;
            case 'snow':
                this.createSnowAnimation(container);
                break;
            case 'thunderstorm':
                this.createThunderstormAnimation(container);
                break;
        }
    }

    createRainAnimation(container) {
        container.className = 'rain-animation';
        
        for (let i = 0; i < 20; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.left = `${Math.random() * 100}%`;
            raindrop.style.animationDelay = `${Math.random() * 1}s`;
            raindrop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            container.appendChild(raindrop);
        }
    }

    createSnowAnimation(container) {
        container.className = 'snow-animation';
        
        for (let i = 0; i < 15; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDelay = `${Math.random() * 3}s`;
            snowflake.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(snowflake);
        }
    }

    createThunderstormAnimation(container) {
        // Add lightning effect
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                container.style.background = 'rgba(255, 255, 255, 0.3)';
                setTimeout(() => {
                    container.style.background = 'transparent';
                }, 100);
            }
        }, 2000);
    }

    createParticles() {
        const container = document.getElementById('particles');
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.width = `${2 + Math.random() * 4}px`;
            particle.style.height = particle.style.width;
            particle.style.animationDelay = `${Math.random() * 6}s`;
            particle.style.animationDuration = `${4 + Math.random() * 4}s`;
            container.appendChild(particle);
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        this.currentTheme = theme;
    }

    toggleUnit() {
        this.currentUnit = this.currentUnit === 'metric' ? 'imperial' : 'metric';
        this.updateUnitToggle();
        localStorage.setItem('unit', this.currentUnit);
        
        // Refresh weather data with new units
        if (this.currentWeatherData) {
            const city = this.currentWeatherData.name;
            this.getWeatherData(city);
        }
    }

    updateUnitToggle() {
        const unitToggle = document.getElementById('unitToggle');
        unitToggle.textContent = this.currentUnit === 'metric' ? '°C' : '°F';
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('dateTime').textContent = now.toLocaleDateString('en', options);
    }

    isDay(sunrise, sunset) {
        const now = Date.now() / 1000;
        return now >= sunrise && now <= sunset;
    }

    showLoading() {
        // You could add a loading state to the main container
        document.getElementById('mainContainer').style.opacity = '0.7';
    }

    hideLoading() {
        document.getElementById('mainContainer').style.opacity = '1';
    }

    showError() {
        document.getElementById('errorState').classList.add('show');
        document.getElementById('currentWeather').style.display = 'none';
    }

    hideError() {
        document.getElementById('errorState').classList.remove('show');
        document.getElementById('currentWeather').style.display = 'block';
    }

    showAlert(message, type = 'info') {
        const alert = document.getElementById('weatherAlert');
        const alertText = alert.querySelector('.alert-text');
        
        alertText.textContent = message;
        alert.className = `weather-alert show ${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.closeAlert();
        }, 5000);
    }

    closeAlert() {
        document.getElementById('weatherAlert').classList.remove('show');
    }
}

// Global function for closing alert (called from HTML)
function closeAlert() {
    document.getElementById('weatherAlert').classList.remove('show');
}

function hideError() {
    document.getElementById('errorState').classList.remove('show');
    document.getElementById('currentWeather').style.display = 'block';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Add some additional utility functions for enhanced functionality
function addToFavorites(city) {
    // Implementation for adding cities to favorites
    console.log(`Adding ${city} to favorites`);
}

function removeFromFavorites(city) {
    // Implementation for removing cities from favorites
    console.log(`Removing ${city} from favorites`);
}

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}