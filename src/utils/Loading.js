export class Loading {
  static getLoadingComponents () {
    const div = document.createElement('div')
    const dots = document.createElement('span')
    const text = 'Fetching Latest Data'
    div.textContent = text

    div.append(dots)
    function animate () {
      const delay = 750 /* ms */
      let prevTimestamp = 0
      let miliSeconds = 1.0
      let iteration = 0
      function animateLoading (timestamp) {
        if (div.dataset.stop) return
        const deltaTime = timestamp - prevTimestamp
        prevTimestamp = timestamp

        miliSeconds += deltaTime
        if (miliSeconds > delay) {
          miliSeconds = 0
          iteration = iteration % 4
          dots.textContent = '.'.repeat(iteration)
          iteration++

          console.log('1 second')
        }
        window.requestAnimationFrame(animateLoading)
      }
      window.requestAnimationFrame(animateLoading)
    }
    animate()
    div.className = 'loading'

    function stopAnimating () {
      div.dataset.stop = 'true'
    }
    function hide () {
      stopAnimating()
      div.style.display = 'none'
    }
    function showError (msg) {
      stopAnimating()
      div.classList.add('error')
      div.textContent = msg
    }
    const usefulData = {
      element: div,
      stopAnimating,
      showError,
      hide
    }
    return usefulData
  }
}
