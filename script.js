const inputBox = document.querySelector(".input-box");
const searchBtn = document.getElementById("searchBtn");
const weather_img = document.querySelector(".weather-img");
const temperature = document.querySelector(".temperature");
const description = document.querySelector(".description");
const humidity = document.getElementById("humidity");
const windspeed = document.getElementById("wind-speed");
const location_not_found = document.querySelector(".location-not-found");
const weather_body = document.querySelector(".weather-body");

async function checkWeather(city) {
    const api_key = "ed43f5d0d5849f986d339158d4d30ccb";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api_key}`;
    const weather_data = await fetch(`${url}`).then(response => response.json());
    if (weather_data.cod === '404') {
        location_not_found.style.display = "flex";
        weather_body.style.display = "none";
        console.log(error);
        return;

    }

    else {
        weather_body.style.display = "flex";
        location_not_found.style.display = "none";
    }
    console.log(weather_data)
    temperature.innerHTML = `${Math.round(weather_data.main.temp - 273.15)}<sup>°C</sup>`;
    description.innerHTML = `${weather_data.weather[0].description}`;
    humidity.innerHTML = `${weather_data.main.humidity}%`;
    windspeed.innerHTML = `${weather_data.wind.speed}km/hr`;

    switch (weather_data.weather[0].main) {
        case "Clouds":
            weather_img.src = "images/cloud.png";
            break;
        case 'Clear':
            weather_img.src = "images/clear.png";
            break;
        case 'Mist':
            weather_img.src = "images/mist.png";
            break;
        case 'Rain':
            weather_img.src = "images/rain.png";
            break;
        case 'Snow':
            weather_img.src = "images/snow.png";
            break;
    }

}


searchBtn.addEventListener("click", () => {
    checkWeather(inputBox.value);
});

