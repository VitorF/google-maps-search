// Variáveis globais
let map
let infoWindow
let markers = []
let userMarker
let radiusCircle
let currentPosition = { lat: 0, lng: -0 } // local padrão
let searchRadius = 500 // Raio inicial em metros


function initMap() {
  // Criar o mapa
  map = new google.maps.Map(document.getElementById("mini-map"), {
    center: currentPosition,
    zoom: 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  })

  infoWindow = new google.maps.InfoWindow()


  document.getElementById("locate-me").addEventListener("click", getUserLocation)


  const radiusSlider = document.getElementById("radius-slider")
  radiusSlider.addEventListener("input", function () {
    searchRadius = Number.parseInt(this.value)
    document.getElementById("radius-value").textContent = searchRadius


    if (currentPosition) {
      searchNearbyPharmacies()
    }
  })


  addTextSearchButton()


  addUserMarker(currentPosition)


  searchNearbyPharmacies()
}

// Obter localização do usuário
function getUserLocation() {
  document.getElementById("loading").style.display = "block"
  document.getElementById("no-results").style.display = "none"

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }


        map.setCenter(currentPosition)


        addUserMarker(currentPosition)


        searchNearbyPharmacies()
      },
      (error) => {
        console.error("Erro ao obter localização:", error)
        alert("Não foi possível obter sua localização. Usando ... como referência.")
        document.getElementById("loading").style.display = "none"
      },
    )
  } else {
    alert("Seu navegador não suporta geolocalização. Usando ... como referência.")//troque o ... pela posição que vai ficar como padrão
    document.getElementById("loading").style.display = "none"
  }
}


function addUserMarker(position) {

  if (userMarker) {
    userMarker.setMap(null)
  }


  userMarker = new google.maps.Marker({
    position: position,
    map: map,
    title: "Sua localização",
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: "#4285F4",
      fillOpacity: 0.8,
      strokeColor: "#FFFFFF",
      strokeWeight: 2,
    },
    zIndex: 999,
  })


  updateRadiusCircle(position)
}


function updateRadiusCircle(position) {

  if (radiusCircle) {
    radiusCircle.setMap(null)
  }


  radiusCircle = new google.maps.Circle({
    strokeColor: "#4285F4",
    strokeOpacity: 0.3,
    strokeWeight: 2,
    fillColor: "#4285F4",
    fillOpacity: 0.1,
    map: map,
    center: position,
    radius: searchRadius,
  })
}


function searchNearbyPharmacies() {

  document.getElementById("loading").style.display = "block"
  document.getElementById("no-results").style.display = "none"
  document.getElementById("places").innerHTML = ""
  document.getElementById("count").textContent = "0"


  clearMarkers()


  updateRadiusCircle(currentPosition)


  const service = new google.maps.places.PlacesService(map)

  // Configurar a requisição
  const request = {
    location: currentPosition,
    radius: searchRadius,
    type: "pharmacy",
    // add palavras-chave para melhorar os resultados
    keyword: "farmácia drogaria remédios medicamentos",
  }

  console.log("Buscando farmácias com os parâmetros:", request)

  // Realizar a busca
  service.nearbySearch(request, (results, status) => {

    document.getElementById("loading").style.display = "none"

    console.log("Status da busca:", status)
    console.log("Resultados:", results)

    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {

      document.getElementById("count").textContent = results.length


      displayPharmacies(results)
    } else {

      document.getElementById("no-results").style.display = "block"
      document.getElementById("no-results").textContent = `Nenhuma farmácia encontrada neste raio. Status: ${status}`

      if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        tryAlternativeSearch()
      }
    }
  })
}

// Função para tentar uma busca alternativa
function tryAlternativeSearch() {
  console.log("Tentando busca alternativa...")

  const service = new google.maps.places.PlacesService(map)

  // Usar uma configuração alternativa
  const request = {
    location: currentPosition,
    radius: searchRadius,
    type: "farmacia",
    keyword: "farmácia drogaria",
  }

  service.nearbySearch(request, (results, status) => {
    console.log("Status da busca alternativa:", status)
    console.log("Resultados alternativos:", results)

    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
      // Filtrar apenas resultados que parecem ser farmácias
      const pharmacyResults = results.filter(
        (place) =>
          place.name.toLowerCase().includes("farm") ||
          place.name.toLowerCase().includes("drog") ||
          (place.types && place.types.includes("pharmacy")),
      )

      if (pharmacyResults.length > 0) {
        document.getElementById("count").textContent = pharmacyResults.length
        displayPharmacies(pharmacyResults)
        document.getElementById("no-results").style.display = "none"
      }
    }
  })
}

// Adicionar função para buscar por texto
function addTextSearchButton() {
  const controlsDiv = document.querySelector(".controls")

  const searchButton = document.createElement("button")
  searchButton.id = "text-search"
  searchButton.className = "btn"
  searchButton.style.marginTop = "10px"
  searchButton.textContent = 'Buscar "Farmácia" no mapa'

  searchButton.addEventListener("click", () => {
    document.getElementById("loading").style.display = "block"
    document.getElementById("no-results").style.display = "none"
    document.getElementById("places").innerHTML = ""
    document.getElementById("count").textContent = "0"

    // Limpar marcadores anteriores
    clearMarkers()

    const service = new google.maps.places.PlacesService(map)

    const request = {
      query: "farmácia drogaria",
      location: currentPosition,
      radius: searchRadius,
    }

    service.textSearch(request, (results, status) => {
      document.getElementById("loading").style.display = "none"

      console.log("Status da busca por texto:", status)
      console.log("Resultados da busca por texto:", results)

      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        document.getElementById("count").textContent = results.length
        displayPharmacies(results)
      } else {
        document.getElementById("no-results").style.display = "block"
        document.getElementById("no-results").textContent = `Nenhuma farmácia encontrada neste raio. Status: ${status}`
      }
    })
  })

  controlsDiv.appendChild(searchButton)
}

// Exibir farmácias encontradas
function displayPharmacies(places) {
  const placesList = document.getElementById("places")

  places.forEach((place, i) => {
    // Adicionar marcador no mapa
    addPharmacyMarker(place, i + 1)


    const distance = calculateDistance(
      currentPosition.lat,
      currentPosition.lng,
      place.geometry.location.lat(),
      place.geometry.location.lng(),
    )

    // Criar item na lista
    const li = document.createElement("li")
    li.className = "pharmacy-item"
    li.innerHTML = `
            <div class="pharmacy-name">${place.name}</div>
            <div class="pharmacy-address">${place.vicinity || place.formatted_address || ""}</div>
            <div class="pharmacy-distance">${distance < 1 ? (distance * 1000).toFixed(0) + "m" : distance.toFixed(1) + "km"}</div>
            ${place.rating ? `<div class="pharmacy-rating">★ ${place.rating.toFixed(1)}</div>` : ""}
        `

    // Adicionar evento de clique para centralizar no mapa
    li.addEventListener("click", () => {
      map.setCenter(place.geometry.location)
      map.setZoom(17)


      const content = `
                <div style="padding: 5px; max-width: 200px;">
                    <strong>${place.name}</strong><br>
                    ${place.vicinity || place.formatted_address || ""}<br>
                    ${place.rating ? `<span style="color: #fbbc05;">★ ${place.rating.toFixed(1)}</span>` : ""}
                </div>
            `
      infoWindow.setContent(content)
      infoWindow.open(map, markers[i])
    })

    placesList.appendChild(li)
  })
}

// Adicionar marcador para farmácia
function addPharmacyMarker(place, number) {
  if (!place.geometry || !place.geometry.location) return

  const marker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: place.name,
    label: {
      text: number.toString(),
      color: "white",
    },
    animation: google.maps.Animation.DROP,
  })

  markers.push(marker)

  // Adicionar evento de clique para mostrar infoWindow
  marker.addListener("click", () => {
    const content = `
            <div style="padding: 5px; max-width: 200px;">
                <strong>${place.name}</strong><br>
                ${place.vicinity || place.formatted_address || ""}<br>
                ${place.rating ? `<span style="color: #fbbc05;">★ ${place.rating.toFixed(1)}</span>` : ""}
            </div>
        `
    infoWindow.setContent(content)
    infoWindow.open(map, marker)
  })
}

// função para limpar todos os marcadores
function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

// Calcular distância entre dois pontos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Raio da Terra em km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distância em km
  return distance
}

// Converter graus para radianos
function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

