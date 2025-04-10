import { WeatherManager } from '@/services/WeatherManager'
import './main-page-style.css'

// Initialize Content Div
document.body.innerHTML = /* html */`
<div id="content">
  <form class="searchForm">
    <input type="text" class="searchInput">
  </form>
  <div class="weather"></div>
</div> 
`

// Handle Form input
const searchForm = document.querySelector('.searchForm')
const searchInput = searchForm.querySelector('.searchInput')

searchForm.addEventListener('submit', (e) => {
  e.preventDefault()
  WeatherManager.getWeatherObject().then(console.log)
  console.log(searchInput.value)
})
