import { WeatherManager } from '@/services/WeatherManager'
import PubSub from 'pubsub-js'
import { TOPICS } from '@/utils/TOPICS'
import './main-page-style.css'
import 'animate.css'

// Initialize Content Div
document.body.innerHTML = /* html */`
<div id="content">
  <form class="searchForm">
    <input type="text" class="searchInput">
  </form>
  <div class="weather">
    <div class='header'>
     <div class="location-address"></div>
     <div class="location-timezone"></div>
    </div>
    <div class="hours"></div>
    <div class="days"></div>
  </div>
</div> 
`

// Handle Form input
const searchForm = document.querySelector('.searchForm')
const searchInput = searchForm.querySelector('.searchInput')
searchInput.focus()
searchForm.addEventListener('submit', showWeatherInfo)

async function showWeatherInfo (event) {
  // Prevent Default Form Submit Behavior
  event.preventDefault()

  const weatherDiv = document.querySelector('.weather')
  // Reset Animation state of .weather
  weatherDiv.className = 'weather'

  try {
    // Display Location Address & Timezone
    const weather = await WeatherManager.getWeatherObject(`${searchInput.value}`)
    const headerDiv = weatherDiv.querySelector('.header')
    const locationAddressDiv = headerDiv.querySelector('.location-address')
    const locationTimeZoneDiv = headerDiv.querySelector('.location-timezone')

    locationAddressDiv.textContent = weather.address
    locationTimeZoneDiv.textContent = weather.timezone

    // Display Hours & Days
    const hoursDiv = weatherDiv.querySelector('.hours')
    hoursDiv.append(getHourlyWeatherComponent(weather.days[0].hours[0]))
    hoursDiv.append(getHourlyWeatherComponent(weather.days[0].hours[9]))
    weatherDiv.classList.add('show')
    console.log(weather)
  } catch (error) {

  }
  console.log(searchInput.value)
}

// Weather Card Components
// {
//   "datetime": "00:00:00",
//   "temp": 84.1,
//   "conditions": "Clear",
//   "icon": "clear-night"
// }
const temperatureReferences = []

function getHourlyWeatherComponent (hour) {
  const formattedTime = getAmPmFormat(hour.datetime)
  const icon = require(`@/assets/weather-icons/${hour.icon}.svg`)
  const temp = Math.round(hour.temp)

  const button = document.createElement('button')
  button.innerHTML = /* html */`
   <p class="time" data-end="${formattedTime.end}">${formattedTime.time}</p>
   <span class="icon" ><img src=${icon} alt="${hour.icon}"></span>
   <p class="temperature" data-temp-unit="F">${temp}</p>
  `

  const temperatureElement = button.querySelector('.temperature')
  temperatureReferences.push(temperatureElement)

  // Publish Hourly Weather Formatted Data
  const formattedData = {
    formattedTime,
    icon,
    temp
  }
  button.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    PubSub.publish(TOPICS.hourlyWeather, formattedData)
  })

  button.className = 'hour'
  return button
}

// Converter Functions C -> F, F -> C
function setTemperatureToCelsius () {
  temperatureReferences.forEach(element => {
    const temp = WeatherManager.fahrenheitToCelsius(element.textContent)
    element.textContent = temp
    element.dataset.tempUnit = 'C'
  })
}

function setTemperatureToFahrenheit () {
  temperatureReferences.forEach(element => {
    const temp = WeatherManager.celsiusToFahrenheit(element.textContent)
    element.textContent = temp
    element.dataset.tempUnit = 'F'
  })
}

// Misc: getAmPmFormat
function getAmPmFormat (datetime) {
  const [hour] = datetime.split(':')
  if (hour > 12) return { time: `${hour - 12}:00`, end: 'PM' }
  return { time: `${hour}:00`, end: 'AM' }
}

// Tests
PubSub.subscribe(TOPICS.hourlyWeather, (_, data) => console.log(data))
