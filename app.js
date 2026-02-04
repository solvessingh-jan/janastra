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

// ================================
// ANIMATED DOT CANVAS BACKGROUND
// ================================

const canvas = document.getElementById('dotCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const dots = [];
const dotCount = 60;
const maxDistance = 150;

for (let i = 0; i < dotCount; i++) {
  dots.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 + 1
  });
}

function animateDots() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  dots.forEach(dot => {
    dot.x += dot.vx;
    dot.y += dot.vy;
    
    if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
    if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;
    
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232, 185, 49, 0.3)';
    ctx.fill();
  });
  
  // Draw connections
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[i].x - dots[j].x;
      const dy = dots[i].y - dots[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < maxDistance) {
        ctx.beginPath();
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(dots[j].x, dots[j].y);
        ctx.strokeStyle = `rgba(232, 185, 49, ${0.15 * (1 - distance / maxDistance)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  
  requestAnimationFrame(animateDots);
}

animateDots();

// ================================
// IMPACT STATS ANIMATION
// ================================

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
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

// Intersection Observer for stats animation
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateValue('stat1', 0, 1250, 2000);
      animateValue('stat2', 0, 847, 2000);
      animateValue('stat3', 0, 3420, 2000);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const impactSection = document.querySelector('.impact-section');
if (impactSection) {
  statsObserver.observe(impactSection);
}

// ================================
// SCAM STATS LOADING
// ================================

async function loadScamStats() {
  try {
    const { count: totalScams } = await supabaseClient
      .from('scam_reports')
      .select('*', { count: 'exact', head: true });
    
    const { data: uniqueNumbers } = await supabaseClient
      .from('scam_reports')
      .select('phone_number');
    
    const blocked = uniqueNumbers ? new Set(uniqueNumbers.map(r => r.phone_number)).size : 0;
    
    const totalScamsEl = document.getElementById('total_scams');
    const blockedEl = document.getElementById('blocked_numbers');
    const savedEl = document.getElementById('saved_amount');
    
    if (totalScamsEl) totalScamsEl.textContent = totalScams || 0;
    if (blockedEl) blockedEl.textContent = blocked;
    if (savedEl) savedEl.textContent = '₹' + (blocked * 15000).toLocaleString();
  } catch (error) {
    console.log('Could not load scam stats');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadScamStats();
});

// ================================
// TAB SWITCHING
// ================================

document.querySelectorAll('.category-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Update active states
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    const section = document.getElementById(tabName);
    if (section) section.classList.add('active');
    
    // Update output
    showMessage(`${tabName.toUpperCase()} section loaded. Ready to receive reports...`, '');
  });
});

// ================================
// GENERIC SUBMIT HELPER
// ================================

async function submitReport(tableName, data, buttonElement) {
  const output = document.querySelector('.output-content');
  const outputDisplay = document.querySelector('.output-display');
  const submitBtn = buttonElement;
  
  if (!output || !submitBtn || !outputDisplay) return;
  
  output.textContent = 'Submitting your report...';
  outputDisplay.className = 'output-display loading';
  submitBtn.disabled = true;
  const originalText = submitBtn.querySelector('span').textContent;
  submitBtn.querySelector('span').textContent = 'Submitting...';

  try {
    const { data: result, error } = await supabaseClient
      .from(tableName)
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    output.textContent = `✅ Success! Your ${tableName.replace('_', ' ')} report has been submitted.\n\nID: ${result.id}\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nThank you for helping your community!`;
    outputDisplay.className = 'output-display success';
    
    // Clear form
    document.querySelectorAll('input, textarea, select').forEach(input => {
      if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else if (input.type !== 'button' && input.type !== 'submit') {
        input.value = '';
      }
    });
    
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}\n\nPlease check your connection and try again.`;
    outputDisplay.className = 'output-display error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = originalText;
  }
}

// ================================
// WATER SECTION
// ================================

function submitWater() {
  const area = document.getElementById('water_area').value.trim();
  const status = document.getElementById('water_status').value;
  
  if (!area || !status) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  submitReport('water_reports', {
    area,
    status,
    reported_at: new Date().toISOString()
  }, event.target);
}

function viewWaterMap() {
  const area = document.getElementById('water_area').value.trim() || 'Delhi';
  const mapsUrl = `https://www.google.com/maps/search/water+supply+${encodeURIComponent(area)},Delhi`;
  window.open(mapsUrl, '_blank');
  showMessage('🗺️ Opening water supply map in new tab...', 'success');
}

async function checkWaterStatus() {
  const area = document.getElementById('water_area').value.trim();
  if (!area) {
    showMessage('Please enter an area first', 'error');
    return;
  }
  
  const output = document.querySelector('.output-content');
  const outputDisplay = document.querySelector('.output-display');
  if (!output || !outputDisplay) return;
  
  outputDisplay.className = 'output-display loading';
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
      outputDisplay.className = 'output-display';
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
    outputDisplay.className = 'output-display success';
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}`;
    outputDisplay.className = 'output-display error';
  }
}

// ================================
// CIVIC SECTION
// ================================

function submitCivic() {
  const area = document.getElementById('civic_area').value.trim();
  const category = document.getElementById('civic_category').value;
  const desc = document.getElementById('civic_desc').value.trim();

  if (!area || !category || !desc) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  submitReport('civic_issues', {
    area,
    category,
    description: desc,
    reported_at: new Date().toISOString()
  }, event.target);
}

function viewCivicMap() {
  const area = document.getElementById('civic_area').value.trim() || 'Delhi';
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(area)},Delhi`;
  window.open(mapsUrl, '_blank');
  showMessage('🗺️ Opening area map in new tab...', 'success');
}

async function viewAreaIssues() {
  const area = document.getElementById('civic_area').value.trim();
  if (!area) {
    showMessage('Please enter an area first', 'error');
    return;
  }
  
  const output = document.querySelector('.output-content');
  const outputDisplay = document.querySelector('.output-display');
  if (!output || !outputDisplay) return;
  
  outputDisplay.className = 'output-display loading';
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
      outputDisplay.className = 'output-display success';
      return;
    }
    
    const issuesList = data.map((issue, i) => 
      `${i+1}. ${issue.category}\n   ${issue.description}\n   Reported: ${new Date(issue.reported_at).toLocaleDateString('en-IN')}`
    ).join('\n\n');
    
    output.textContent = `Civic Issues in "${area}" (${data.length} found):\n\n${issuesList}`;
    outputDisplay.className = 'output-display success';
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}`;
    outputDisplay.className = 'output-display error';
  }
}

// ================================
// TRAFFIC SECTION
// ================================

function submitTraffic() {
  const area = document.getElementById('traffic_area').value.trim();
  const issue = document.getElementById('traffic_issue').value;

  if (!area || !issue) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  submitReport('traffic_reports', {
    area,
    issue_type: issue,
    reported_at: new Date().toISOString()
  }, event.target);
}

function viewLiveTraffic() {
  const area = document.getElementById('traffic_area').value.trim() || 'Connaught Place, Delhi';
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(area)}/@28.6139,77.2090,14z/data=!5m1!1e1`;
  window.open(mapsUrl, '_blank');
  showMessage('🚦 Opening live traffic map in new tab...', 'success');
}

async function getTrafficReport() {
  const area = document.getElementById('traffic_area').value.trim();
  if (!area) {
    showMessage('Please enter an area/road name first', 'error');
    return;
  }
  
  const output = document.querySelector('.output-content');
  const outputDisplay = document.querySelector('.output-display');
  if (!output || !outputDisplay) return;
  
  outputDisplay.className = 'output-display loading';
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
      outputDisplay.className = 'output-display';
      return;
    }
    
    const recentReports = data.slice(0, 5).map((report, i) => {
      const timeAgo = getTimeAgo(new Date(report.reported_at));
      return `${i+1}. ${report.issue_type} - ${timeAgo}`;
    }).join('\n');
    
    output.textContent = `Traffic Reports for "${area}":\n\n${recentReports}\n\n💡 Tip: Check live map for real-time traffic colors`;
    outputDisplay.className = 'output-display success';
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}`;
    outputDisplay.className = 'output-display error';
  }
}

// ================================
// SCAM SECTION
// ================================

function showScamTab(tab) {
  const clickedButton = event.target.closest('.toggle-button');
  document.querySelectorAll('.toggle-button').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.scam-panel').forEach(s => s.style.display = 'none');
  
  clickedButton.classList.add('active');
  const section = document.getElementById('scam_' + tab);
  if (section) section.style.display = 'block';
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
  
  if (!resultDiv || !iconDiv || !statusDiv || !detailsDiv || !reportsDiv) return;
  
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
      statusDiv.innerHTML = '<span style="color: #4ade80;">Safe Number</span>';
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
    
    showMessage('', '');
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

function submitScam() {
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

  submitReport('scam_reports', {
    phone_number: phone,
    area,
    scam_type: scamType,
    description: desc,
    reported_at: new Date().toISOString()
  }, event.target);
  
  // Reload stats after submission
  setTimeout(() => loadScamStats(), 1000);
}

// ================================
// CLINICS SECTION
// ================================

async function loadClinics() {
  const area = document.getElementById('clinic_area').value.trim();
  const specialty = document.getElementById('clinic_specialty').value;
  const output = document.querySelector('.output-content');
  const outputDisplay = document.querySelector('.output-display');

  if (!area) {
    showMessage('Please enter your area', 'error');
    return;
  }

  if (!output || !outputDisplay) return;

  output.textContent = '🔍 Searching for clinics nearby...';
  outputDisplay.className = 'output-display loading';

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
    outputDisplay.className = 'output-display error';
    return;
  }

  if (!data || data.length === 0) {
    output.textContent = `No clinics found in "${area}"${specialty ? ` with specialty: ${specialty}` : ''}.\n\nTry searching nearby areas or view map for more options.`;
    outputDisplay.className = 'output-display';
    return;
  }

  const clinicsList = data.map((clinic, i) => 
    `${i+1}. 🏥 ${clinic.name}\n   📍 ${clinic.address}\n   📞 ${clinic.phone || 'N/A'}\n   ${clinic.specialty ? `🔧 ${clinic.specialty}` : ''}`
  ).join('\n\n');

  output.textContent = `Found ${data.length} clinic(s) in "${area}":\n\n${clinicsList}\n\n💡 Click "View on Map" to see locations`;
  outputDisplay.className = 'output-display success';
}

function viewClinicsMap() {
  const area = document.getElementById('clinic_area').value.trim() || 'Delhi';
  const specialty = document.getElementById('clinic_specialty').value || 'hospital';
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(specialty + ' near ' + area + ', Delhi')}`;
  window.open(mapsUrl, '_blank');
  showMessage('🗺️ Opening clinics map in new tab...', 'success');
}

function getDirections() {
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

// ================================
// UTILITY FUNCTIONS
// ================================

function showMessage(message, type = '') {
  const output = document.querySelector('.output-content');
  const outputDisplay = document.querySelector('.output-display');
  if (!output || !outputDisplay) return;
  output.textContent = message;
  outputDisplay.className = 'output-display ' + type;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
  return Math.floor(seconds / 86400) + ' days ago';
}
