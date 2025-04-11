import testJSON from './test.json'

/* eslint-disable */
async function fetchWeatherData (searchQuery) {
  const request = new Request(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURI(searchQuery)}?unitGroup=us&elements=datetime%2Cname%2Caddress%2Ctemp%2Csunrise%2Csunset%2Cmoonphase%2Cconditions%2Cicon&key=ASKP3CM7N4CST3EYQCA84QRU3&contentType=json`)
  if (testJSON) return testJSON // TODO: remove after done testing
  try {
    const response = 'await fetch(request)'
    if (!response.ok) throw new Error(`Error: ${response.status}`)
      const json = await response.json()
    return json
  } catch (error) {
    console.log(error)
    return undefined
  }
}
/* eslint-enable */

export class WeatherManager {
  static weatherObject

  static fahrenheitToCelsius (fahrenheit) {
    return Math.round((fahrenheit - 32.0) * 5.0 / 9.0)
  }

  static celsiusToFahrenheit (celsius) {
    return Math.round((celsius * 9.0 / 5.0) + 32.0)
  }

  static async getWeatherObject (location) {
    const data = await fetchWeatherData(location)

    // Data am going to use
    const usefulData = {
      address: data.address,
      timezone: data.timezone,
      days: data.days.slice(0, 7)
    }
    // Remove Past hours
    const currentDay = usefulData.days[0]
    const currentHour = Number(data.currentConditions.datetime.substring(0, 2))
    currentDay.hours = currentDay.hours.filter((hour) => {
      const hourValue = Number(hour.datetime.substring(0, 2))
      if (hourValue >= currentHour) return true
      return false
    })

    return usefulData
  }
}
