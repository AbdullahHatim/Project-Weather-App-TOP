export class CountryFlag {
  static async findAndAppend (AccurateCountryName, element) {
    try {
    // Use the country name from the weather data if available, otherwise fallback to search input
    // Assuming weather object might eventually contain country info. For now, using searchInput.
      const countryName = AccurateCountryName // Or potentially extract from weather data if passed
      const encodedCountryName = encodeURIComponent(countryName)
      const countryApiUrl = `https://api.first.org/data/v1/countries?q=${encodedCountryName}`

      const response = await fetch(countryApiUrl)
      if (!response.ok) {
      // Don't throw an error that stops execution, just log and exit gracefully
        console.warn(`Could not fetch country data for ${countryName}. Status: ${response.status}`)
        return
      }
      const countryData = await response.json()

      // Extract the country code (e.g., 'BE')
      const countryCode = Object.keys(countryData.data)[0]

      if (countryCode) {
        const img = document.createElement('img')
        img.src = `https://flagsapi.com/${countryCode}/shiny/64.png`
        img.alt = `${countryCode}` // More descriptive alt text
        img.classList.add('country-flag') // Add a class for potential styling
        img.style.marginRight = '8px' // Add some spacing
        img.style.verticalAlign = 'middle' // Align vertically with text
        // Prepend the flag before the text content is set
        element.append(img)
      } else {
        console.warn('Could not find country code for:', countryName)
      }
    } catch (error) {
      console.error('Error fetching country flag:', error)
    // Don't let flag errors break the main weather display
    }
  }

  static async findAndPrepend (AccurateCountryName, element) {
    try {
    // Use the country name from the weather data if available, otherwise fallback to search input
    // Assuming weather object might eventually contain country info. For now, using searchInput.
      const countryName = AccurateCountryName // Or potentially extract from weather data if passed
      const encodedCountryName = encodeURIComponent(countryName)
      const countryApiUrl = `https://api.first.org/data/v1/countries?q=${encodedCountryName}`

      const response = await fetch(countryApiUrl)
      if (!response.ok) {
      // Don't throw an error that stops execution, just log and exit gracefully
        console.warn(`Could not fetch country data for ${countryName}. Status: ${response.status}`)
        return
      }
      const countryData = await response.json()

      // Extract the country code (e.g., 'BE')
      const countryCode = Object.keys(countryData.data)[0]

      if (countryCode) {
        const img = document.createElement('img')
        img.src = `https://flagsapi.com/${countryCode}/shiny/64.png`
        img.alt = `${countryCode}` // More descriptive alt text
        img.classList.add('country-flag') // Add a class for potential styling
        img.style.marginRight = '8px' // Add some spacing
        img.style.verticalAlign = 'middle' // Align vertically with text
        // Prepend the flag before the text content is set
        element.prepend(img)
      } else {
        console.warn('Could not find country code for:', countryName)
      }
    } catch (error) {
      console.error('Error fetching country flag:', error)
    // Don't let flag errors break the main weather display
    }
  }
}
