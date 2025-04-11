import { WeatherManager } from '@/services/WeatherManager'
import PubSub from 'pubsub-js'
import { TOPICS } from '@/utils/TOPICS'
import { Loading } from '@/utils/Loading'
import './main-page-style.css'
import 'animate.css'

// Initialize Content Div
document.body.innerHTML = /* html */`
<div id="content">
  <form class="searchForm">
    <input type="text" class="searchInput">
  </form>
  <div class="loading-container"></div>
  <div class="weather">
    <div class='header'>
     <div class="location-address"></div>
     <div class="location-timezone"></div>
    </div>
   <div class="main"></div> 
    <div class="hours-container">
      <div class="hours"></div>
    </div>
    <div class="days-container">
      <div class="days"></div>
    </div>
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
    // Testing
    showLoading()
    await new Promise(r => (setTimeout(() => { console.log('done'); r() }, 1000)))
    // End: Testing
    // Display Location Address & Timezone
    const weather = await WeatherManager.getWeatherObject(`${searchInput.value}`)

    // Remove Loading After Weather is loaded
    hideLoading()
    const headerDiv = weatherDiv.querySelector('.header')
    const locationAddressDiv = headerDiv.querySelector('.location-address')
    const locationTimeZoneDiv = headerDiv.querySelector('.location-timezone')

    locationAddressDiv.textContent = weather.address
    locationTimeZoneDiv.textContent = weather.timezone

    // Display Hours & Days
    const daysDiv = weatherDiv.querySelector('.days')
    const hoursDiv = weatherDiv.querySelector('.hours')
    weather.days.forEach(day => {
      daysDiv.append(getDailyWeatherComponent(day))
    })
    weather.days[0].hours.forEach(hour => {
      hoursDiv.append(getHourlyWeatherComponent(hour))
    })

    initMainDailyComponent()
    weatherDiv.classList.add('show')
  } catch (error) {
    loadingError('Location Not Found!')
    console.log(error)
  }
  console.log(searchInput.value)
}
// Loading Components
const loadingContainer = document.querySelector('.loading-container')
let loadingObj

function showLoading () {
  loadingContainer.innerHTML = ''
  loadingObj = Loading.getLoadingComponents()
  loadingContainer.append(loadingObj.element)
}
function hideLoading () {
  loadingObj.hide()
}
function loadingError (msg) {
  loadingObj.showError(msg)
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

  // * This is a BUTTON for consistent UI styling with Daily Component
  const button = document.createElement('button')
  button.innerHTML = /* html */`
   <p class="time" data-end="${formattedTime.end}">${formattedTime.time}</p>
   <span class="icon" ><img src=${icon} alt="${hour.icon}"></span>
   <p class="temperature" data-temp-unit="F">${temp}</p>
  `

  const temperatureElement = button.querySelector('.temperature')
  temperatureReferences.push(temperatureElement)

  button.className = 'hour'
  return button
}
function getDailyWeatherComponent (day) {
  function getDateFormat (datetime) {
    // "2025-04-10"
    const monthDay = datetime.slice(-5)
    const formatted = monthDay.split('-').join('/')
    return formatted
  }

  const formattedDate = getDateFormat(day.datetime)
  const icon = require(`@/assets/weather-icons/${day.icon}.svg`)
  const temp = Math.round(day.temp)

  const button = document.createElement('button')
  button.innerHTML = /* html */`
   <p class="time">${formattedDate}</p>
   <span class="icon" ><img src=${icon} alt="${day.icon}"></span>
   <p class="temperature" data-temp-unit="F">${temp}</p>
  `

  const temperatureElement = button.querySelector('.temperature')
  temperatureReferences.push(temperatureElement)

  // Publish Hourly Weather Formatted Data
  const info = day.icon.split('-').join(' ')
  const formattedData = {
    formattedDate,
    icon,
    info,
    temp
  }
  button.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    PubSub.publish(TOPICS.dailyWeather, formattedData)
  })

  button.className = 'day'
  return button
}

function initMainDailyComponent () {
  const mainDiv = document.querySelector('.main')
  const firstDay = document.querySelector('.day')
  PubSub.subscribe(TOPICS.dailyWeather, (_, formattedData) => {
    const { formattedDate, icon, info, temp } = formattedData
    mainDiv.innerHTML = /* html */`
    <p class="time">${formattedDate}</p>
    <span class="icon" ><img src=${icon} alt="${info}.icon"></span>
    <p class="condition">${info}</p>
    <p class="temperature" data-temp-unit="F">${temp}</p>
    `
    // ! This will keep a Reference even after the innerHTML is changed
    const temperatureElement = mainDiv.querySelector('.temperature')
    temperatureReferences.push(temperatureElement)
  })
  firstDay.click()
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

// Misc: getAmPmFormat // TODO: Put this back inside getHourlyWeatherComponent, its only used there
function getAmPmFormat (datetime) {
  const [hour] = datetime.split(':')
  if (hour > 12) return { time: `${hour - 12}:00`, end: 'PM' }
  return { time: `${hour}:00`, end: 'AM' }
}

// Tests
PubSub.subscribe(TOPICS.hourlyWeather, (_, data) => console.log(data))
