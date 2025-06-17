class WeatherApp {
    constructor() {
        this.API_KEY = "ed43f5d0d5849f986d339158d4d30ccb";
        this.BASE_URL = "https://api.openweathermap.org/data/2.5";
        this.currentUnit = 'celsius';
        this.currentWeatherData = null;
        this.recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTheme();
        this.updateDateTime();
        this.displayRecentSearches();
        
        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    initializeElements() {
        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.locationBtn = document.getElementById('locationBtn');
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        
        // State elements
        this.loading = document.getElementById('loading');
        this.errorState = document.getElementById('errorState');
        this.weatherContent = document.getElementById('weatherContent');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Weather display elements
        this.cityName = document.getElementById('cityName');
        this.country = document.getElementById('country');
        this.dateTime = document.getElementById('dateTime');
        this.temperature = document.getElementById('temperature');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.weatherDescription = document.getElementById('weatherDescription');
        
        // Stats elements
        this.visibility = document.getElementById('visibility');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.feelsLike = document.getElementById('feelsLike');
        this.pressure = document.getElementById('pressure');
        this.uvIndex = document.getElementById('uvIndex');
        
        // Additional info elements
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
        this.aqiValue = document.getElementById('aqiValue');
        this.aqiStatus = document.getElementById('aqiStatus');
        
        // Forecast elements
        this.hourlyForecast = document.getElementById('hourlyForecast');
        this.weeklyForecast = document.getElementById('weeklyForecast');
        
        // Recent searches
        this.recentSearches = document.getElementById('recentSearches');
        this.recentList = document.getElementById('recentList');
        
        // Unit buttons
        this.unitButtons = document.querySelectorAll('.unit-btn');
    }

    initializeEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.searchInput.addEventListener('input', () => this.toggleClearButton());
        this.clearBtn.addEventListener('click', () => this.clearSearch());
        
        // Location button
        this.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Retry button
        this.retryBtn.addEventListener('click', () => this.handleSearch());
        
        // Unit toggle
        this.unitButtons.forEach(btn => {
            btn.addEventListener('click', () => this.toggleUnit(btn.dataset.unit));
        });
        
        // Recent searches
        this.recentList.addEventListener('click', (e) => {
            if (e.target.classList.contains('recent-item')) {
                this.searchInput.value = e.target.textContent;
                this.handleSearch();
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        this.dateTime.textContent = now.toLocaleDateString('en-US', options);
    }

    toggleClearButton() {
        this.clearBtn.style.opacity = this.searchInput.value ? '1' : '0';
    }

    clearSearch() {
        this.searchInput.value = '';
        this.toggleClearButton();
        this.searchInput.focus();
    }

    async handleSearch() {
        const city = this.searchInput.value.trim();
        if (!city) return;

        this.showLoading();
        
        try {
            const weatherData = await this.fetchWeatherData(city);
            this.currentWeatherData = weatherData;
            this.displayWeatherData(weatherData);
            this.addToRecentSearches(city);
            this.showWeatherContent();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError();
        }
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const weatherData = await this.fetchWeatherDataByCoords(latitude, longitude);
                    this.currentWeatherData = weatherData;
                    this.displayWeatherData(weatherData);
                    this.searchInput.value = weatherData.name;
                    this.addToRecentSearches(weatherData.name);
                    this.showWeatherContent();
                } catch (error) {
                    console.error('Error fetching weather data:', error);
                    this.showError();
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showError();
            }
        );
    }

    async fetchWeatherData(city) {
        const response = await fetch(
            `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Weather data not found');
        }
        
        return await response.json();
    }

    async fetchWeatherDataByCoords(lat, lon) {
        const response = await fetch(
            `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Weather data not found');
        }
        
        return await response.json();
    }

    displayWeatherData(data) {
        // Basic info
        this.cityName.textContent = data.name;
        this.country.textContent = data.sys.country;
        
        // Temperature
        const temp = this.currentUnit === 'celsius' ? data.main.temp : this.celsiusToFahrenheit(data.main.temp);
        this.temperature.textContent = `${Math.round(temp)}°`;
        
        // Weather description and icon
        this.weatherDescription.textContent = data.weather[0].description;
        this.updateWeatherIcon(data.weather[0].main);
        
        // Stats
        this.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        this.humidity.textContent = `${data.main.humidity}%`;
        this.windSpeed.textContent = `${data.wind.speed} m/s`;
        
        const feelsLike = this.currentUnit === 'celsius' ? data.main.feels_like : this.celsiusToFahrenheit(data.main.feels_like);
        this.feelsLike.textContent = `${Math.round(feelsLike)}°`;
        
        this.pressure.textContent = `${data.main.pressure} hPa`;
        
        // UV Index (mock data since it's not in basic API)
        this.uvIndex.textContent = Math.floor(Math.random() * 11);
        
        // Sun times
        this.sunrise.textContent = this.formatTime(data.sys.sunrise);
        this.sunset.textContent = this.formatTime(data.sys.sunset);
        
        // Mock air quality data
        this.updateAirQuality();
        
        // Generate forecast data
        this.generateHourlyForecast(data);
        this.generateWeeklyForecast(data);
    }

    updateWeatherIcon(weatherMain) {
        const iconMap = {
            'Clear': 'images/clear.png',
            'Clouds': 'images/cloud.png',
            'Rain': 'images/rain.png',
            'Snow': 'images/snow.png',
            'Mist': 'images/mist.png',
            'Fog': 'images/mist.png',
            'Haze': 'images/mist.png'
        };
        
        this.weatherIcon.src = iconMap[weatherMain] || 'images/cloud.png';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    updateAirQuality() {
        const aqiValues = [
            { value: 42, status: 'Good', color: '#10b981' },
            { value: 68, status: 'Moderate', color: '#f59e0b' },
            { value: 95, status: 'Unhealthy', color: '#ef4444' }
        ];
        
        const randomAqi = aqiValues[Math.floor(Math.random() * aqiValues.length)];
        this.aqiValue.textContent = randomAqi.value;
        this.aqiStatus.textContent = randomAqi.status;
        this.aqiValue.style.color = randomAqi.color;
        this.aqiStatus.style.color = randomAqi.color;
    }

    generateHourlyForecast(data) {
        this.hourlyForecast.innerHTML = '';
        
        for (let i = 1; i <= 24; i++) {
            const hour = new Date();
            hour.setHours(hour.getHours() + i);
            
            const tempVariation = (Math.random() - 0.5) * 10;
            const temp = data.main.temp + tempVariation;
            const displayTemp = this.currentUnit === 'celsius' ? temp : this.celsiusToFahrenheit(temp);
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.innerHTML = `
                <div class="hourly-time">${hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true })}</div>
                <img src="${this.weatherIcon.src}" alt="Weather" class="hourly-icon">
                <div class="hourly-temp">${Math.round(displayTemp)}°</div>
                <div class="hourly-desc">${data.weather[0].main}</div>
            `;
            
            this.hourlyForecast.appendChild(hourlyItem);
        }
    }

    generateWeeklyForecast(data) {
        this.weeklyForecast.innerHTML = '';
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            const highTemp = data.main.temp + Math.random() * 5;
            const lowTemp = data.main.temp - Math.random() * 5;
            
            const displayHigh = this.currentUnit === 'celsius' ? highTemp : this.celsiusToFahrenheit(highTemp);
            const displayLow = this.currentUnit === 'celsius' ? lowTemp : this.celsiusToFahrenheit(lowTemp);
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day">
                    <img src="${this.weatherIcon.src}" alt="Weather" class="forecast-icon">
                    <div class="day-info">
                        <h4>${days[date.getDay()]}</h4>
                        <p>${data.weather[0].description}</p>
                    </div>
                </div>
                <div class="forecast-temps">
                    <span class="temp-high">${Math.round(displayHigh)}°</span>
                    <span class="temp-low">${Math.round(displayLow)}°</span>
                </div>
                <div class="forecast-details">
                    <span>${Math.floor(Math.random() * 30 + 40)}%</span>
                    <span>${Math.floor(Math.random() * 20 + 5)} km/h</span>
                </div>
            `;
            
            this.weeklyForecast.appendChild(forecastItem);
        }
    }

    toggleUnit(unit) {
        if (this.currentUnit === unit) return;
        
        this.currentUnit = unit;
        this.unitButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        
        if (this.currentWeatherData) {
            this.displayWeatherData(this.currentWeatherData);
        }
    }

    celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    addToRecentSearches(city) {
        const searches = this.recentSearches.filter(search => 
            search.toLowerCase() !== city.toLowerCase()
        );
        searches.unshift(city);
        this.recentSearches = searches.slice(0, 5);
        
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
        this.displayRecentSearches();
    }

    displayRecentSearches() {
        if (this.recentSearches.length === 0) {
            this.recentSearches.style.display = 'none';
            return;
        }
        
        this.recentList.innerHTML = '';
        this.recentSearches.forEach(search => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.textContent = search;
            this.recentList.appendChild(item);
        });
        
        this.recentSearches.classList.add('show');
    }

    showLoading() {
        this.loading.classList.add('show');
        this.errorState.classList.remove('show');
        this.weatherContent.classList.remove('show');
    }

    showError() {
        this.loading.classList.remove('show');
        this.errorState.classList.add('show');
        this.weatherContent.classList.remove('show');
    }

    showWeatherContent() {
        this.loading.classList.remove('show');
        this.errorState.classList.remove('show');
        this.weatherContent.classList.add('show');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Service Worker registration for PWA capabilities
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