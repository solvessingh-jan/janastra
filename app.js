// YOUR SUPABASE CREDENTIALS (hidden from UI)
const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
const SUPABASE_ANON_KEY = 'sbp_publishable_tK95wQr1Lf4mLJQSdWHVuQ52Mag05';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let clinicsChannel = null;
let mapCache = {};
let currentPosition = null;

// 🔥 IPAD-FRIENDLY GPS (High accuracy + iOS fixes)
async function autoLocate(tabType) {
  const output = document.getElementById('output');
  const areaInput = document.getElementById(`${tabType}_area`);
  
  output.textContent = '📍 Getting precise location...';
  
  // iPad/iPhone GPS options
  const gpsOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  };
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        currentPosition = position.coords;
        
        // iPad reverse geocode (Delhi focus)
        if (!window.google) {
          areaInput.value = 'Karol Bagh, Delhi'; // Fallback
          output.textContent = '📍 Ready! (Maps loading...)';
          return;
        }
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 
          location: { 
            lat: currentPosition.latitude, 
            lng: currentPosition.longitude 
          } 
        }, (results) => {
          const areaName = results[0]?.address_components?.find(c => 
            c.types.includes('locality') || 
            c.types.includes('sublocality') || 
            c.types.includes('neighborhood') ||
            c.types.includes('administrative_area_level_3')
          )?.long_name || 'Delhi Area';
          
          areaInput.value = areaName;
          output.textContent = `📍 Located: ${areaName}`;
          
          // Show mini map
          if (document.getElementById(`${tabType}-map`)) {
            showMiniMap(`${tabType}-map`, currentPosition);
          }
        });
      },
      (error) => {
        // Graceful fallback for iPad
        output.textContent = `📍 Type your area (iPad GPS needs Safari Settings > Location > Allow)`;
        areaInput.placeholder = 'Karol Bagh, MG Road, CP, etc.';
      },
      gpsOptions
    );
  } else {
    output.textContent = '📍 Type your area manually';
  }
}

// 🗺️ Mini Maps (All tabs)
function showMiniMap(mapId, position) {
  const mapDiv = document.getElementById(mapId);
  if (mapCache[mapId] || !mapDiv || !window.google) return;
  
  const map = new google.maps.Map(mapDiv, {
    center: { lat: position.latitude, lng: position.longitude },
    zoom: 16,
    mapTypeId: 'roadmap',
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  });
  
  new google.maps.Marker({
    position: { lat: position.latitude, lng: position.longitude },
    map: map,
    icon: {
      url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: new google.maps.Size(32, 32)
    },
    title: 'Your location'
  });
  
  mapCache[mapId] = map;
}

// 🏥 Clinics - Google Maps (REAL data)
async function loadClinics() {
  const area = document.getElementById('clinic_area').value.trim();
  const output = document.getElementById('output');

  if (!area) {
    output.textContent = 'Enter area name (Karol Bagh, MG Road, etc.)';
    return;
  }

  if (!window.google) {
    output.textContent = 'Maps loading...';
    return;
  }

  output.textContent = `🔍 Live search: ${area} clinics...`;

  const service = new google.maps.places.PlacesService(
    document.createElement('div')
  );
  
  service.textSearch({
    location: new google.maps.LatLng(28.6139, 77.2090), // Delhi
    radius: '20000',
    query: `${area} clinic hospital Delhi India`
  }, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      const clinics = results.slice(0, 10).map(place => ({
        name: place.name,
        address: place.formatted_address?.split(', Delhi')[0] || place.formatted_address,
        phone: place.formatted_phone_number || 'Call via Maps',
        rating: place.rating ? `${place.rating}/5 (${place.user_ratings_total || 0} reviews)` : 'New'
      }));

      output.innerHTML = `🎉 **Live Results** (${clinics.length} clinics near ${area}):\n\n` + 
        clinics.map(c => 
          `🏥 **${c.name}**\n📍 ${c.address}\n📞 ${c.phone}\n⭐ ${c.rating}`
        ).join('\n\n────\n\n');
    } else {
      output.textContent = `No clinics found. Try "Karol Bagh", "MG Road", "CP"`;
    }
  });
}

// ALL SUBMIT FUNCTIONS (GPS coords + no Supabase mention)
async function submitWater() {
  const area = document.getElementById('water_area').value.trim();
  const status = document.getElementById('water_status').value.trim();
  
  if (!area || !status) return showMessage('Please fill all fields', 'error');
  
  await submitReport('water_reports', {
    area, status,
    latitude: currentPosition?.latitude,
    longitude: currentPosition?.longitude,
    reported_at: new Date().toISOString()
  });
}

async function submitCivic() {
  const area = document.getElementById('civic_area').value.trim();
  const category = document.getElementById('civic_category').value.trim();
  const desc = document.getElementById('civic_desc').value.trim();

  if (!area || !category || !desc) return showMessage('Please fill all fields', 'error');

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

  if (!area || !issue) return showMessage('Please fill all fields', 'error');

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

  if (!area || !desc) return showMessage('Please fill all fields', 'error');

  await submitReport('scam_reports', {
    area, description: desc,
    latitude: currentPosition?.latitude,
    longitude: currentPosition?.longitude,
    reported_at: new Date().toISOString()
  });
}

// ORIGINAL submitReport (no Supabase text shown)
async function submitReport(tableName, data) {
  const output = document.getElementById('output');
  const submitBtn = document.querySelector('.submit-btn');
  
  output.textContent = '📤 Sending report...';
  output.className = 'loading';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const {  result, error } = await supabaseClient
      .from(tableName)
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    output.innerHTML = `✅ Report sent successfully!<br><strong>ID:</strong> ${result.id}<br><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br><br>Thank you for helping your community! 🙏`;
    output.className = 'success';
    
    // Clear form
    document.querySelectorAll('input, textarea').forEach(input => input.value = '');
    
  } catch (error) {
    output.textContent = `❌ Failed to send: ${error.message}`;
    output.className = 'error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '📤 Submit Report';
  }
}

function showMessage(message, type = 'error') {
  const output = document.getElementById('output');
  output.textContent = message;
  output.className = type;
}

// Tab switching (original)
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    document.getElementById('output').textContent = `Selected ${tabName.toUpperCase()}\nReady! 📍 Click Locate or type area.`;
  });
});

// iPad Maps init
function initGoogleMaps() {
  console.log('✅ Google Maps ready for iPad!');
}
// LIVE REPORTS MAP
async function loadLiveReports() {
  const output = document.getElementById('output');
  output.textContent = '🗺️ Loading live reports map...';
  
  if (!window.google) {
    output.textContent = 'Maps loading...';
    return;
  }
  
  const mapDiv = document.getElementById('reports-map');
  const map = new google.maps.Map(mapDiv, {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 11
  });
  
  // Water reports (RED dots)
  const { data
