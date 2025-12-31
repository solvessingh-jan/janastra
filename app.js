// YOUR SUPABASE (KEEP WORKING)
const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Maps variables
let mapCache = {};
let currentPosition = null;

// 🚀 AUTO-LOCATE FOR ALL TABS
async function autoLocate(tabType) {
  const output = document.getElementById('output');
  const areaInput = document.getElementById(`${tabType}_area`);
  const mapDiv = document.getElementById(`${tabType}-map`);
  
  output.textContent = '📍 Detecting your GPS location...';
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      currentPosition = position.coords;
      
      // Reverse geocode to get area name
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat: currentPosition.latitude, lng: currentPosition.longitude };
      
      geocoder.geocode({ location: latlng }, (results) => {
        const areaName = results[0]?.address_components?.find(c => 
          c.types.includes('locality') || c.types.includes('sublocality') || c.types.includes('neighborhood')
        )?.long_name || 'Your Location';
        
        areaInput.value = areaName;
        output.textContent = `📍 Located: ${areaName}`;
        
        // Show mini map
        showMiniMap(tabType, latlng);
      });
    }, () => {
      output.textContent = 'GPS access denied. Type your area manually.';
    });
  }
}

// 🗺️ MINI MAP HELPER
function showMiniMap(tabType, center) {
  const mapDiv = document.getElementById(`${tabType}-map`);
  if (!mapDiv || mapCache[tabType]) return;
  
  const map = new google.maps.Map(mapDiv, {
    center: center,
    zoom: 15,
    styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
  });
  
  // Your location marker
  new google.maps.Marker({
    position: center,
    map: map,
    icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    title: 'You are here'
  });
  
  mapCache[tabType] = map;
}

// 🔥 ALL YOUR ORIGINAL FUNCTIONS + LOCATION DATA
async function submitWater() {
  const area = document.getElementById('water_area').value.trim();
  const status = document.getElementById('water_status').value.trim();
  
  if (!area || !status) return showMessage('Fill all fields', 'error');
  
  await submitReport('water_reports', {
    area,
    status,
    latitude: currentPosition?.latitude,
    longitude: currentPosition?.longitude,
    reported_at: new Date().toISOString()
  });
}

async function submitCivic() {
  const area = document.getElementById('civic_area').value.trim();
  const category = document.getElementById('civic_category').value.trim();
  const desc = document.getElementById('civic_desc').value.trim();

  if (!area || !category || !desc) return showMessage('Fill all fields', 'error');

  await submitReport('civic_issues', {
    area, category, description: desc,
    latitude: currentPosition?.latitude,
    longitude: currentPosition?.longitude,
    reported_at: new Date().toISOString()
  });
}

async function submitTraffic() {
  const area = document.getElementById('traffic_area').value.trim();
  const issue = document.getElementById('traffic_issue').value.trim();

  if (!area || !issue) return showMessage('Fill all fields', 'error');

  await submitReport('traffic_reports', {
    area, issue_type: issue,
    latitude: currentPosition?.latitude,
    longitude: currentPosition?.longitude,
    reported_at: new Date().toISOString()
  });
}

async function submitScam() {
  const area = document.getElementById('scam_area').value.trim();
  const desc = document.getElementById('scam_desc').value.trim();

  if (!area || !desc) return showMessage('Fill all fields', 'error');

  await submitReport('scam_reports', {
    area, description: desc,
    latitude: currentPosition?.latitude,
    longitude: currentPosition?.longitude,
    reported_at: new Date().toISOString()
  });
}

// 🏥 CLINICS - Google Places (REAL DATA)
async function loadClinics() {
  const area = document.getElementById('clinic_area').value.trim();
  const output = document.getElementById('output');
  const mapDiv = document.getElementById('clinics-map');

  if (!area || !window.google) {
    output.textContent = 'Enter area & wait for Google Maps';
    return;
  }

  output.textContent = `🔍 Live search: "${area}" clinics...`;

  const service = new google.maps.places.PlacesService(mapDiv);
  const request = {
    location: new google.maps.LatLng(28.6139, 77.2090),
    radius: '15000',
    query: `${area} clinic hospital Delhi`
  };

  service.textSearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      const clinics = results.slice(0, 10).map(place => ({
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number || 'N/A',
        rating: place.rating ? `${place.rating}/5 (${place.user_ratings_total || 0} reviews)` : 'New'
      }));

      const html = clinics.map(c => 
        `🏥 **${c.name}**\n📍 ${c.address}\n📞 ${c.phone}\n⭐ ${c.rating}`
      ).join('\n\n────\n\n');

      output.innerHTML = `🎉 **LIVE Results** (${clinics.length} clinics):\n\n${html}`;
      
      // Clinics map
      if (!mapCache['clinics']) {
        const map = new google.maps.Map(mapDiv, { zoom: 13, center: { lat: 28.6139, lng: 77.2090 } });
        clinics.slice(0, 5).forEach(place => {
          new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: 'https://maps.google.com/mapfiles/ms/icons/hospital.png'
          });
        });
        mapCache['clinics'] = map;
      }
    }
  });
}

// YOUR ORIGINAL FUNCTIONS (KEEP ALL)
async function submitReport(tableName, data) {
  // ... your existing submitReport code stays EXACTLY same
}

// Tab switching + all other code stays same...
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  });
});

function showMessage(msg, type) {
  document.getElementById('output').textContent = msg;
  document.getElementById('output').className = type;
}
