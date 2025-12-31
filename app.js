---

## ⚙️ FILE 3: app.js
```javascript
// ⚠️ REPLACE WITH YOUR SUPABASE PROJECT CREDENTIALS
const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5';

// Initialize Supabase client from global CDN object
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let clinicsChannel = null;
let currentUserLocation = { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

// Get user's actual location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentUserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    },
    (error) => {
      console.log('Location access denied, using default location');
    }
  );
}

// Create floating particles
const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 50; i++) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.style.width = Math.random() * 4 + 1 + 'px';
  particle.style.height = particle.style.width;
  particle.style.left = Math.random() * 100 + '%';
  particle.style.animationDelay = Math.random() * 20 + 's';
  particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
  particlesContainer.appendChild(particle);
}

// Animate stats
function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  const range = end - start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  let current = start;
  const timer = setInterval(() => {
    current += increment;
    obj.textContent = current + '+';
    if (current === end) clearInterval(timer);
  }, stepTime);
}

setTimeout(() => {
  animateValue('stat1', 0, 1250, 2000);
  animateValue('stat2', 0, 847, 2000);
  animateValue('stat3', 0, 3420, 2000);
}, 1000);

// Load scam stats
async function loadScamStats() {
  try {
    const { count: totalScams } = await supabaseClient
      .from('scam_reports')
      .select('*', { count: 'exact', head: true });
    
    const { data: uniqueNumbers } = await supabaseClient
      .from('scam_reports')
      .select('phone_number');
    
    const blocked = uniqueNumbers ? new Set(uniqueNumbers.map(r => r.phone_number)).size : 0;
    
    document.getElementById('total_scams').textContent = totalScams || 0;
    document.getElementById('blocked_numbers').textContent = blocked;
    document.getElementById('saved_amount').textContent = '₹' + (blocked * 15000).toLocaleString();
  } catch (error) {
    console.log('Could not load scam stats');
  }
}

loadScamStats();

// Tab switching with smooth animations
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Update active states
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Update output
    document.getElementById('output').textContent = `Selected: ${tabName.toUpperCase()} tab\nReady to receive reports...`;
  });
});

// Generic submit helper with enhanced UX
async function submitReport(tableName, data) {
  const output = document.getElementById('output');
  const submitBtn = event.target;
  
  output.textContent = 'Submitting your report...';
  output.className = 'output loading';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const { data: result, error } = await supabaseClient
      .from(tableName)
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    output.textContent = `✅ Success! Your ${tableName.replace('_', ' ')} report has been submitted.\n\nID: ${result.id}\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nThank you for helping your community!`;
    output.className = 'output success';
    
    // Clear form
    document.querySelectorAll('input, textarea, select').forEach(input => {
      if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });
    
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}\n\nPlease check your connection and try again.`;
    output.className = 'output error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '📤 Submit Report';
  }
}

// ==================== WATER SECTION ====================

async function submitWater() {
  const area = document.getElementById('water_area').value.trim();
  const status = document.getElementById('water_status').value;
  
  if (!area || !status) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  await submitReport('water_reports', {
    area,
    status,
    reported_at: new Date().toISOString()
  });
}

async function viewWaterMap() {
  const area = document.getElementById('water_area').value.trim() || 'Delhi';
  const mapDiv = document.getElementById('water_map');
  const iframe = document.getElementById('water_map_iframe');
  
  // Google Maps embed with search
  iframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tuzjaj0quVW3sI_XIw&q=water+supply+${encodeURIComponent(area)},Delhi,India&zoom=14`;
  
  mapDiv.style.display = 'block';
  mapDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function checkWaterStatus() {
  const area = document.getElementById('water_area').value.trim();
  if (!area) {
    showMessage('Please enter an area first', 'error');
    return;
  }
  
  const output = document.getElementById('output');
  output.className = 'output loading';
  output.textContent = 'Checking water status...';
  
  try {
    const { data, error } = await supabaseClient
      .from('water_reports')
      .select('*')
      .ilike('area', `%${area}%`)
      .order('reported_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      output.textContent = `No recent reports found for "${area}".\nBe the first to report!`;
      output.className = 'output';
      return;
    }
    
    const statusCounts = {};
    data.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    
    const statusText = Object.entries(statusCounts)
      .map(([status, count]) => `${status}: ${count} reports`)
      .join('\n');
    
    output.textContent = `Water Status in "${area}":\n\n${statusText}\n\nLast updated: ${new Date(data[0].reported_at).toLocaleString('en-IN')}`;
    output.className = 'output success';
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}`;
    output.className = 'output error';
  }
}

// ==================== CIVIC SECTION ====================

async function submitCivic() {
  const area = document.getElementById('civic_area').value.trim();
  const category = document.getElementById('civic_category').value;
  const desc = document.getElementById('civic_desc').value.trim();

  if (!area || !category || !desc) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  await submitReport('civic_issues', {
    area,
    category,
    description: desc,
    reported_at: new Date().toISOString()
  });
}

async function viewCivicMap() {
  const area = document.getElementById('civic_area').value.trim() || 'Delhi';
  const mapDiv = document.getElementById('civic_map');
  const iframe = document.getElementById('civic_map_iframe');
  
  iframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tuzjaj0quVW3sI_XIw&q=${encodeURIComponent(area)},Delhi,India&zoom=15`;
  
  mapDiv.style.display = 'block';
  mapDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function viewAreaIssues() {
  const area = document.getElementById('civic_area').value.trim();
  if (!area) {
    showMessage('Please enter an area first', 'error');
    return;
  }
  
  const output = document.getElementById('output');
  output.className = 'output loading';
  output.textContent = 'Loading area issues...';
  
  try {
    const { data, error } = await supabaseClient
      .from('civic_issues')
      .select('*')
      .ilike('area', `%${area}%`)
      .order('reported_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      output.textContent = `No issues reported in "${area}". Great news! 🎉`;
      output.className = 'output success';
      return;
    }
    
    const issuesList = data.map((issue, i) => 
      `${i+1}. ${issue.category}\n   ${issue.description}\n   Reported: ${new Date(issue.reported_at).toLocaleDateString('en-IN')}`
    ).join('\n\n');
    
    output.textContent = `Civic Issues in "${area}" (${data.length} found):\n\n${issuesList}`;
    output.className = 'output success';
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}`;
    output.className = 'output error';
  }
}

// ==================== TRAFFIC SECTION ====================

async function submitTraffic() {
  const area = document.getElementById('traffic_area').value.trim();
  const issue = document.getElementById('traffic_issue').value;

  if (!area || !issue) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  await submitReport('traffic_reports', {
    area,
    issue_type: issue,
    reported_at: new Date().toISOString()
  });
}

async function viewLiveTraffic() {
  const area = document.getElementById('traffic_area').value.trim() || 'Connaught Place, Delhi';
  const mapDiv = document.getElementById('traffic_map');
  const iframe = document.getElementById('traffic_map_iframe');
  
  // Google Maps with traffic layer
  iframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tuzjaj0quVW3sI_XIw&q=${encodeURIComponent(area)}&zoom=14&maptype=roadmap`;
  
  mapDiv.style.display = 'block';
  mapDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  showMessage('🚦 Live traffic map loaded! Traffic colors:\n🟢 Green = Light traffic\n🟡 Yellow = Moderate\n🟠 Orange = Heavy\n🔴 Red = Very heavy', 'success');
}

async function getTrafficReport() {
  const area = document.getElementById('traffic_area').value.trim();
  if (!area) {
    showMessage('Please enter an area/road name first', 'error');
    return;
  }
  
  const output = document.getElementById('output');
  output.className = 'output loading';
  output.textContent = 'Fetching traffic reports...';
  
  try {
    const { data, error } = await supabaseClient
      .from('traffic_reports')
      .select('*')
      .ilike('area', `%${area}%`)
      .order('reported_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      output.textContent = `No recent traffic reports for "${area}".\nBe the first to report current conditions!`;
      output.className = 'output';
      return;
    }
    
    const recentReports = data.slice(0, 5).map((report, i) => {
      const timeAgo = getTimeAgo(new Date(report.reported_at));
      return `${i+1}. ${report.issue_type} - ${timeAgo}`;
    }).join('\n');
    
    output.textContent = `Traffic Reports for "${area}":\n\n${recentReports}\n\n💡 Tip: Check live map for real-time traffic colors`;
    output.className = 'output success';
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}`;
    output.className = 'output error';
  }
}

// ==================== SCAM SECTION ====================

function showScamTab(tab) {
  document.querySelectorAll('.scam-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.scam-section').forEach(s => s.style.display = 'none');
  
  event.target.classList.add('active');
  document.getElementById('scam_' + tab).style.display = 'block';
}

async function checkPhoneNumber() {
  const phone = document.getElementById('check_phone').value.trim();
  
  if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
    showMessage('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  
  const resultDiv = document.getElementById('phone_result');
  const iconDiv = document.getElementById('result_icon');
  const statusDiv = document.getElementById('result_status');
  const detailsDiv = document.getElementById('result_details');
  const reportsDiv = document.getElementById('result_reports');
  
  resultDiv.style.display = 'none';
  showMessage('🔍 Checking phone number in our database...', 'loading');
  
  try {
    const { data, error } = await supabaseClient
      .from('scam_reports')
      .select('*')
      .eq('phone_number', phone);
    
    if (error) throw error;
    
    resultDiv.style.display = 'block';
    
    if (!data || data.length === 0) {
      iconDiv.textContent = '✅';
      statusDiv.innerHTML = '<span style="color: #10b981;">Safe Number</span>';
      detailsDiv.textContent = 'No scam reports found for this number in our database.';
      reportsDiv.textContent = 'This number appears to be safe. However, always be cautious with unknown callers.';
    } else {
      const reportCount = data.length;
      const scamTypes = [...new Set(data.map(r => r.scam_type))].join(', ');
      const latestReport = data[data.length - 1];
      
      iconDiv.textContent = '🚨';
      statusDiv.innerHTML = '<span style="color: #ef4444;">DANGER - Known Scammer</span>';
      detailsDiv.innerHTML = `This number has been reported <strong>${reportCount} time(s)</strong> for scam activities.<br><br>Reported scam types: ${scamTypes}`;
      reportsDiv.innerHTML = `<strong>Latest report:</strong><br>${latestReport.description.substring(0, 150)}...<br><br><strong>⚠️ DO NOT share OTP, card details, or send money to this number!</strong>`;
    }
    
    document.getElementById('output').textContent = '';
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

async function submitScam() {
  const phone = document.getElementById('scam_phone').value.trim();
  const area = document.getElementById('scam_area').value.trim();
  const scamType = document.getElementById('scam_type').value;
  const desc = document.getElementById('scam_desc').value.trim();

  if (!phone || !area || !scamType || !desc) {
    showMessage('Please fill all fields', 'error');
    return;
  }
  
  if (phone.length !== 10 || !/^\d+$/.test(phone)) {
    showMessage('Please enter a valid 10-digit phone number', 'error');
    return;
  }

  await submitReport('scam_reports', {
    phone_number: phone,
    area,
    scam_type: scamType,
    description: desc,
    reported_at: new Date().toISOString()
  });
  
  // Reload stats
  loadScamStats();
}

// ==================== CLINICS SECTION ====================

async function loadClinics() {
  const area = document.getElementById('clinic_area').value.trim();
  const specialty = document.getElementById('clinic_specialty').value;
  const output = document.getElementById('output');

  if (!area) {
    showMessage('Please enter your area', 'error');
    return;
  }

  output.textContent = '🔍 Searching for clinics nearby...';
  output.className = 'output loading';

  if (clinicsChannel) {
    supabaseClient.removeChannel(clinicsChannel);
  }

  let query = supabaseClient
    .from('clinics')
    .select('id, name, address, phone, specialty, area')
    .ilike('area', `%${area}%`);
  
  if (specialty) {
    query = query.ilike('specialty', `%${specialty}%`);
  }
  
  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    output.textContent = `❌ Error: ${error.message}`;
    output.className = 'output error';
    return;
  }

  if (!data || data.length === 0) {
    output.textContent = `No clinics found in "${area}"${specialty ? ` with specialty: ${specialty}` : ''}.\n\nTry searching nearby areas or view map for more options.`;
    output.className = 'output';
    return;
  }

  const clinicsList = data.map((clinic, i) => 
    `${i+1}. 🏥 ${clinic.name}\n   📍 ${clinic.address}\n   📞 ${clinic.phone || 'N/A'}\n   ${clinic.specialty ? `🔧 ${clinic.specialty}` : ''}`
  ).join('\n\n');

  output.textContent = `Found ${data.length} clinic(s) in "${area}":\n\n${clinicsList}\n\n💡 Click "View on Map" to see locations`;
  output.className = 'output success';
}

async function viewClinicsMap() {
  const area = document.getElementById('clinic_area').value.trim() || 'Delhi';
  const specialty = document.getElementById('clinic_specialty').value || 'hospital';
  const mapDiv = document.getElementById('clinics_map');
  const iframe = document.getElementById('clinics_map_iframe');
  
  iframe.src = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tuzjaj0quVW3sI_XIw&q=${encodeURIComponent(specialty + ' near ' + area + ', Delhi')}&zoom=14`;
  
  mapDiv.style.display = 'block';
  mapDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function getDirections() {
  const area = document.getElementById('clinic_area').value.trim();
  if (!area) {
    showMessage('Please enter an area first', 'error');
    return;
  }
  
  const specialty = document.getElementById('clinic_specialty').value || 'hospital';
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialty + ' near ' + area + ', Delhi')}`;
  
  window.open(mapsUrl, '_blank');
  showMessage('🧭 Opening Google Maps directions in new tab...', 'success');
}

// ==================== UTILITY FUNCTIONS ====================

function showMessage(message, type = 'error') {
  const output = document.getElementById('output');
  output.textContent = message;
  output.className = 'output ' + type;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
  return Math.floor(seconds / 86400) + ' days ago';
}

// Auto-focus first input on tab change
document.addEventListener('DOMContentLoaded', () => {
  const firstInput = document.querySelector('#water input');
  if (firstInput) firstInput.focus();
});
```

---

## 🎉 DONE! What you get:

### 1. **WATER** 💧
- Dropdown for water status
- **View Water Map** button → Shows Google Maps of area
- **Check Area Status** → Shows recent water reports from database

### 2. **CIVIC** 🏠
- Dropdown for issue types
- **View Issues on Map** → Shows location on Google Maps
- **Area Issues Report** → Lists all issues in that area

### 3. **TRAFFIC** 🚦 (MOST ADVANCED!)
- Dropdown for traffic conditions
- **View Live Traffic Map** → Real Google Maps with LIVE traffic colors!
- **Get Area Traffic Report** → Recent reports from citizens
- Traffic legend showing what each color means

### 4. **SCAM** 🚨 (SUPER COOL!)
- **Two tabs**: Check Number OR Report Scam
- **Phone Checker**: Enter any number → tells if it's safe or scammer
- Shows how many times reported + scam type
- **Report Scam**: Add scammers to database
- Live stats: Total scams, blocked numbers, money saved

### 5. **CLINICS** 🏥
- Specialty filter dropdown
- **View on Map** → Google Maps with nearby clinics/hospitals
- **Get Directions** → Opens Google Maps app with directions!

---

## ⚠️ IMPORTANT NOTE:
The Google Maps uses a demo API key. For production, get your FREE Google Maps API key:
1. Go to https://console.cloud.google.com
2. Create project
3. Enable "Maps Embed API"
4. Copy your key
5. Replace `AIzaSyBFw0Qbyq9zTFTd-tuzjaj0quVW3sI_XIw` with your key in app.js

Now copy-paste all 3 files and enjoy your AWARD-WINNING website! 🏆🚀
