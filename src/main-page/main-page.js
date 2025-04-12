import { WeatherManager } from '@/services/WeatherManager'
import PubSub from 'pubsub-js'
import { TOPICS } from '@/utils/TOPICS'
import { Loading } from '@/utils/Loading'
import { CountryFlag } from '@/utils/CountryFlag'
import './main-page-style.css'
import 'animate.css'

// Initialize Content Div
document.body.innerHTML = /* html */`
<div id="content">
  <form class="searchForm">
    <input type="text" class="searchInput">
  </form>
  <div class="loading-container"></div>
 <div class="weather"></div> 
</div> 
`

// Handle Form input
const searchForm = document.querySelector('.searchForm')
const searchInput = searchForm.querySelector('.searchInput')
searchInput.value = 'Palestine'
searchInput.placeholder = 'Free Palestine 🍉'
CountryFlag.cachePalestineFlag()
searchInput.focus()
searchForm.addEventListener('submit', showWeatherInfo)

async function showWeatherInfo (event) {
  // Prevent Default Form Submit Behavior
  if (event) event.preventDefault()
  resetWeatherComponent()
  const weatherDiv = document.querySelector('.weather')
  try {
    showLoading()
    // Delay to give breathing room for animations and showLoading()
    await new Promise(resolve => (setTimeout(resolve, 300)))

    const weather = await WeatherManager.getWeatherObject(`${searchInput.value}`)

    // Remove Loading After Weather is loaded
    hideLoading()
    // Display Location Address & Timezone
    const headerDiv = weatherDiv.querySelector('.header')
    const locationAddressDiv = headerDiv.querySelector('.location-address')
    const locationTimeZoneDiv = headerDiv.querySelector('.location-timezone')

    // Add Country Flag
    CountryFlag.findAndPrepend(searchInput.value, locationAddressDiv)

    locationAddressDiv.textContent = weather.address
    locationTimeZoneDiv.textContent = weather.timezone

    // Display Hours & Days
    const daysDiv = weatherDiv.querySelector('.days')
    const hoursDiv = weatherDiv.querySelector('.hours')
    weather.days.forEach((day, index) => {
      daysDiv.append(getDailyWeatherComponent(day, index))
    })
    updateHourlyComponentsOnDailyClick({ hoursDiv, weather })

    // Show First Day by Default
    initMainDailyComponent()
    weatherDiv.classList.add('show')
  } catch (error) {
    // There are some other errors to consider but idgaf
    loadingError('Location Not Found!')
    console.log(error)
  }
}
// Main Weather Component resetter reset
function resetWeatherComponent () {
  const weather = document.querySelector('.weather')
  weather.className = 'weather'
  weather.innerHTML = `
    <div class='header'>
     <div class="location-address"></div>
     <div class="location-timezone"></div>
     <div class="temp-swap-btns">
      <button class="f">F</button>
      <button class="c">C</button>
     </div>
    </div>
   <div class="main"></div> 
    <div class="hours-container">
      <div class="hours"></div>
    </div>
    <div class="days-container">
      <div class="days"></div>
    </div>
  `
  addTemperatureButtonEvents()
}

// Loading controllers
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
// Update Functions
function updateHourlyComponentsOnDailyClick (data) {
  PubSub.subscribe(TOPICS.dailyWeather, (_, formattedData) => {
    data.hoursDiv.scrollLeft = 0
    if (formattedData.index === 0 && !!data.weather) {
      data.hoursDiv.innerHTML = ''
      data.weather.nowPlus24Hours.forEach((hour, index) => {
        data.hoursDiv.append(getHourlyWeatherComponent(hour, index))
      })
    } else {
      data.hoursDiv.innerHTML = ''
      formattedData.hours.forEach(hour => {
        data.hoursDiv.append(getHourlyWeatherComponent(hour))
      })
    }
  })
}

// Weather Components
const temperatureReferences = []

function getHourlyWeatherComponent (hour, index) {
  function getAmPmFormat (datetime) {
    const [hour] = datetime.split(':')
    if (hour > 12) return { time: `${hour - 12}:00`, end: 'PM' }
    return { time: `${hour}:00`, end: 'AM' }
  }

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
  button.dataset.hourIndex = index ?? -1
  button.className = 'hour'
  return button
}
function getDailyWeatherComponent (day, index) {
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
    temp,
    hours: day.hours,
    index
  }
  button.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    PubSub.publish(TOPICS.dailyWeather, formattedData)
  })

  button.className = 'day'
  button.dataset.dayIndex = index
  return button
}

function initMainDailyComponent () {
  const mainDiv = document.querySelector('.main')
  const firstDay = document.querySelector('.day')
  PubSub.subscribe(TOPICS.dailyWeather, (_, formattedData) => {
    const { formattedDate, icon, info, temp } = formattedData
    mainDiv.innerHTML = /* html */`
    <p class="time">${formattedDate}</p>
    <span class="icon" ><img src=${icon} alt="${info}"></span>
    <p class="condition">${info}</p>
    <p class="temperature" data-temp-unit="F">${temp}</p>
    `
    // ! This will keep a Reference even after the innerHTML is changed
    const temperatureElement = mainDiv.querySelector('.temperature')
    temperatureReferences.push(temperatureElement)
    updateTheme(info)
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
// Weather Temperature Control Events

function addTemperatureButtonEvents () {
//  <div class="temp-swap-btns">
//   <button class="f active">F</button>
//   <button class="c">C</button>
//  </div>
  const temperatureButtons = document.querySelector('.temp-swap-btns')
  const celsiusButton = temperatureButtons.querySelector('.c')
  const fahrenheitButton = temperatureButtons.querySelector('.f')
  fahrenheitButton.className = 'f active'
  celsiusButton.className = 'c'
  temperatureButtons.addEventListener('click', (e) => {
    const currentTemp = temperatureReferences[0].dataset.tempUnit
    if (currentTemp === 'C') {
      fahrenheitButton.className = 'f active'
      celsiusButton.className = 'c'
      setTemperatureToFahrenheit()
    } else if (currentTemp === 'F') {
      celsiusButton.className = 'c active'
      fahrenheitButton.className = 'f'
      setTemperatureToCelsius()
    }
  })
}

// Misc: theme update update theme

function updateTheme (info = '') {
  const keywords = [
    'day',
    'night',
    'cloud', 'fog',
    'rain', 'thunder',
    'snow'
  ]
  const match = info.split(' ').find((word) => {
    return keywords.find(keyword => word.match(keyword))
  })
  if (match) {
    document.body.className = `weather-${match}`
  }
}
