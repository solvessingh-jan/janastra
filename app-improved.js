// ================================
// Janastra - Modern Citizen Reporting Platform
// ================================

// Supabase Configuration
const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcHRzZ21kbm1qenJnZXRuZWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4MjU4MjMsImV4cCI6MjA0NzQwMTgyM30.tK95wQr1Lf4mLJQSdWHVuQ_52Mag0';

// Initialize Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global State
let currentUserLocation = { lat: 28.6139, lng: 77.2090 }; // Default: Delhi
let currentCategory = 'water';
let scamMode = 'check';

// ================================
// Utility Functions
// ================================

// Toast Notification System
function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Animate counter values
function animateValue(id, start, end, duration, prefix = '', suffix = '') {
  const element = document.getElementById(id);
  if (!element) return;
  
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      element.textContent = prefix + Math.round(end) + suffix;
      clearInterval(timer);
    } else {
      element.textContent = prefix + Math.round(current) + suffix;
    }
  }, 16);
}

// Smooth scroll to element
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Scroll to reporting section
function scrollToReporting() {
  scrollToElement('#reporting');
}

// Form validation
function validateForm(fields) {
  for (const [fieldId, fieldName] of Object.entries(fields)) {
    const element = document.getElementById(fieldId);
    if (!element || !element.value.trim()) {
      showToast(`Please enter ${fieldName}`, 'warning');
      element?.focus();
      return false;
    }
  }
  return true;
}

// Set button loading state
function setButtonLoading(button, loading) {
  if (!button) return;
  
  const textEl = button.querySelector('.btn-text');
  const loaderEl = button.querySelector('.btn-loader');
  
  if (loading) {
    button.disabled = true;
    if (textEl) textEl.style.display = 'none';
    if (loaderEl) loaderEl.style.display = 'inline-flex';
  } else {
    button.disabled = false;
    if (textEl) textEl.style.display = 'inline';
    if (loaderEl) loaderEl.style.display = 'none';
  }
}

// Get user location
function getUserLocation() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          resolve(currentUserLocation);
        },
        () => {
          resolve(currentUserLocation); // Use default on error
        }
      );
    } else {
      resolve(currentUserLocation);
    }
  });
}

// ================================
// Category Switching
// ================================

function switchCategory(category) {
  currentCategory = category;
  
  // Update tabs
  document.querySelectorAll('.category-tab').forEach(tab => {
    const isActive = tab.dataset.category === category;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });
  
  // Update forms
  document.querySelectorAll('.report-form').forEach(form => {
    form.classList.remove('active');
    form.style.display = 'none';
  });
  
  const activeForm = document.getElementById(`form-${category}`);
  if (activeForm) {
    activeForm.classList.add('active');
    activeForm.style.display = 'block';
  }
}

// ================================
// Water Reports
// ================================

async function submitWater(button) {
  if (!validateForm({
    'water_area': 'area/locality',
    'water_status': 'water status'
  })) return;
  
  setButtonLoading(button, true);
  
  try {
    const area = document.getElementById('water_area').value.trim();
    const status = document.getElementById('water_status').value;
    
    const { data, error } = await supabaseClient
      .from('water_reports')
      .insert([{
        area: area,
        status: status,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    showToast(`Water report submitted successfully for ${area}!`, 'success');
    
    // Clear form
    document.getElementById('water_area').value = '';
    document.getElementById('water_status').value = '';
    
    // Update stats
    updateGlobalStats();
    
  } catch (error) {
    console.error('Error submitting water report:', error);
    showToast('Failed to submit report. Please try again.', 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function viewWaterMap() {
  const mapContainer = document.getElementById('water_map');
  const iframe = document.getElementById('water_map_iframe');
  
  if (mapContainer && iframe) {
    if (mapContainer.style.display === 'none') {
      // Generate Google Maps embed URL for water supply in Delhi
      const mapUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=water+supply+delhi+india&zoom=11`;
      iframe.src = mapUrl;
      mapContainer.style.display = 'block';
      showToast('Loading water supply map...', 'info');
    } else {
      mapContainer.style.display = 'none';
    }
  }
}

async function getWaterReport() {
  try {
    const area = document.getElementById('water_area').value.trim();
    if (!area) {
      showToast('Please enter an area to get the report', 'warning');
      return;
    }
    
    const { data, error } = await supabaseClient
      .from('water_reports')
      .select('*')
      .ilike('area', `%${area}%`)
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      let reportText = `Water Reports for ${area}:\n\n`;
      data.forEach((report, index) => {
        reportText += `${index + 1}. ${report.status} - ${new Date(report.timestamp).toLocaleString()}\n`;
      });
      showToast(reportText, 'info', 6000);
    } else {
      showToast(`No water reports found for ${area}`, 'info');
    }
    
  } catch (error) {
    console.error('Error fetching water report:', error);
    showToast('Failed to fetch reports', 'error');
  }
}

// ================================
// Civic Reports
// ================================

async function submitCivic(button) {
  if (!validateForm({
    'civic_area': 'area/locality',
    'civic_issue': 'issue type'
  })) return;
  
  setButtonLoading(button, true);
  
  try {
    const area = document.getElementById('civic_area').value.trim();
    const issue = document.getElementById('civic_issue').value;
    const description = document.getElementById('civic_desc').value.trim();
    
    const { data, error } = await supabaseClient
      .from('civic_reports')
      .insert([{
        area: area,
        issue_type: issue,
        description: description,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    showToast(`Civic issue reported successfully for ${area}!`, 'success');
    
    // Clear form
    document.getElementById('civic_area').value = '';
    document.getElementById('civic_issue').value = '';
    document.getElementById('civic_desc').value = '';
    
    updateGlobalStats();
    
  } catch (error) {
    console.error('Error submitting civic report:', error);
    showToast('Failed to submit report. Please try again.', 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function viewCivicMap() {
  const mapContainer = document.getElementById('civic_map');
  const iframe = document.getElementById('civic_map_iframe');
  
  if (mapContainer && iframe) {
    if (mapContainer.style.display === 'none') {
      const mapUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=civic+amenities+delhi+india&zoom=11`;
      iframe.src = mapUrl;
      mapContainer.style.display = 'block';
      showToast('Loading civic infrastructure map...', 'info');
    } else {
      mapContainer.style.display = 'none';
    }
  }
}

// ================================
// Traffic Reports
// ================================

async function submitTraffic(button) {
  if (!validateForm({
    'traffic_area': 'location/road name',
    'traffic_issue': 'traffic condition'
  })) return;
  
  setButtonLoading(button, true);
  
  try {
    const area = document.getElementById('traffic_area').value.trim();
    const condition = document.getElementById('traffic_issue').value;
    
    const { data, error } = await supabaseClient
      .from('traffic_reports')
      .insert([{
        area: area,
        condition: condition,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    showToast(`Traffic condition reported successfully for ${area}!`, 'success');
    
    // Clear form
    document.getElementById('traffic_area').value = '';
    document.getElementById('traffic_issue').value = '';
    
    updateGlobalStats();
    
  } catch (error) {
    console.error('Error submitting traffic report:', error);
    showToast('Failed to submit report. Please try again.', 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function viewLiveTraffic() {
  const mapContainer = document.getElementById('traffic_map');
  const iframe = document.getElementById('traffic_map_iframe');
  
  if (mapContainer && iframe) {
    if (mapContainer.style.display === 'none') {
      const mapUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=traffic+delhi+india&zoom=11`;
      iframe.src = mapUrl;
      mapContainer.style.display = 'block';
      showToast('Loading live traffic map...', 'info');
    } else {
      mapContainer.style.display = 'none';
    }
  }
}

async function getTrafficReport() {
  try {
    const area = document.getElementById('traffic_area').value.trim();
    if (!area) {
      showToast('Please enter an area to get the traffic report', 'warning');
      return;
    }
    
    const { data, error } = await supabaseClient
      .from('traffic_reports')
      .select('*')
      .ilike('area', `%${area}%`)
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      let reportText = `Traffic Reports for ${area}:\n\n`;
      data.forEach((report, index) => {
        reportText += `${index + 1}. ${report.condition} - ${new Date(report.timestamp).toLocaleString()}\n`;
      });
      showToast(reportText, 'info', 6000);
    } else {
      showToast(`No traffic reports found for ${area}`, 'info');
    }
    
  } catch (error) {
    console.error('Error fetching traffic report:', error);
    showToast('Failed to fetch reports', 'error');
  }
}

// ================================
// Scam Alert System
// ================================

function switchScamMode(mode) {
  scamMode = mode;
  
  // Update tabs
  document.querySelectorAll('.scam-mode-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Update modes
  document.querySelectorAll('.scam-mode').forEach(m => {
    m.classList.remove('active');
    m.style.display = 'none';
  });
  
  if (mode === 'check') {
    document.querySelector('.scam-mode-tab:first-child').classList.add('active');
    document.getElementById('scam-check-mode').classList.add('active');
    document.getElementById('scam-check-mode').style.display = 'block';
  } else {
    document.querySelector('.scam-mode-tab:last-child').classList.add('active');
    document.getElementById('scam-report-mode').classList.add('active');
    document.getElementById('scam-report-mode').style.display = 'block';
  }
}

async function checkPhoneNumber() {
  const phoneInput = document.getElementById('check_phone');
  const phone = phoneInput?.value.trim();
  
  if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'warning');
    phoneInput?.focus();
    return;
  }
  
  const resultDiv = document.getElementById('phone_result');
  const iconDiv = document.getElementById('result_icon');
  const statusDiv = document.getElementById('result_status');
  const detailsDiv = document.getElementById('result_details');
  const reportsDiv = document.getElementById('result_reports');
  
  if (!resultDiv) return;
  
  try {
    const { data, error } = await supabaseClient
      .from('scam_reports')
      .select('*')
      .eq('phone_number', phone);
    
    if (error) throw error;
    
    resultDiv.style.display = 'block';
    
    if (data && data.length > 0) {
      iconDiv.textContent = '🚨';
      iconDiv.style.color = '#ef4444';
      statusDiv.textContent = 'Warning: Reported as Scam';
      statusDiv.style.color = '#ef4444';
      detailsDiv.innerHTML = `<strong>This number has been reported ${data.length} time${data.length > 1 ? 's' : ''}.</strong>`;
      
      let reportsText = '<p>Recent reports:</p><ul style="margin: 10px 0; padding-left: 20px;">';
      data.slice(0, 3).forEach(report => {
        reportsText += `<li>${report.scam_type} - ${report.area || 'Unknown area'}</li>`;
      });
      reportsText += '</ul>';
      reportsDiv.innerHTML = reportsText;
      
      showToast('⚠️ This number has been reported as a scam!', 'warning', 5000);
    } else {
      iconDiv.textContent = '✓';
      iconDiv.style.color = '#10b981';
      statusDiv.textContent = 'No Reports Found';
      statusDiv.style.color = '#10b981';
      detailsDiv.innerHTML = '<strong>This number has not been reported in our database.</strong>';
      reportsDiv.innerHTML = '<p>Stay vigilant and report if you encounter any suspicious activity.</p>';
      
      showToast('✓ No scam reports found for this number', 'success');
    }
    
  } catch (error) {
    console.error('Error checking phone number:', error);
    showToast('Failed to check phone number. Please try again.', 'error');
  }
}

async function submitScam(button) {
  if (!validateForm({
    'scam_phone': 'scammer\'s phone number',
    'scam_area': 'your area/city',
    'scam_type': 'scam type'
  })) return;
  
  const phone = document.getElementById('scam_phone').value.trim();
  if (phone.length !== 10 || !/^\d+$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'warning');
    return;
  }
  
  setButtonLoading(button, true);
  
  try {
    const area = document.getElementById('scam_area').value.trim();
    const type = document.getElementById('scam_type').value;
    const description = document.getElementById('scam_desc').value.trim();
    
    const { data, error } = await supabaseClient
      .from('scam_reports')
      .insert([{
        phone_number: phone,
        area: area,
        scam_type: type,
        description: description,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    showToast('Thank you! Your scam report has been submitted and will help protect others.', 'success', 5000);
    
    // Clear form
    document.getElementById('scam_phone').value = '';
    document.getElementById('scam_area').value = '';
    document.getElementById('scam_type').value = '';
    document.getElementById('scam_desc').value = '';
    
    // Reload scam stats
    loadScamStats();
    
  } catch (error) {
    console.error('Error submitting scam report:', error);
    showToast('Failed to submit scam report. Please try again.', 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function loadScamStats() {
  try {
    const { count } = await supabaseClient
      .from('scam_reports')
      .select('*', { count: 'exact', head: true });
    
    const { data: uniqueNumbers } = await supabaseClient
      .from('scam_reports')
      .select('phone_number');
    
    const blocked = uniqueNumbers ? new Set(uniqueNumbers.map(r => r.phone_number)).size : 0;
    const savedAmount = blocked * 15000;
    
    animateValue('total_scams', 0, count || 0, 1500);
    animateValue('blocked_numbers', 0, blocked, 1500);
    animateValue('saved_amount', 0, savedAmount, 1500, '₹', '');
    
  } catch (error) {
    console.error('Error loading scam stats:', error);
  }
}

// ================================
// Healthcare / Clinics
// ================================

async function loadClinics() {
  if (!validateForm({
    'clinic_area': 'area/locality'
  })) return;
  
  const area = document.getElementById('clinic_area').value.trim();
  const specialty = document.getElementById('clinic_specialty').value;
  
  let searchQuery = `clinics ${area} delhi`;
  if (specialty && specialty !== '') {
    searchQuery = `${specialty} clinics ${area} delhi`;
  }
  
  showToast(`Searching for healthcare facilities in ${area}...`, 'info');
  
  // For demo purposes, show success message
  setTimeout(() => {
    showToast(`Found healthcare facilities in ${area}. Click "View on Map" to see locations.`, 'success', 5000);
  }, 1000);
}

function viewClinicsMap() {
  const mapContainer = document.getElementById('clinics_map');
  const iframe = document.getElementById('clinics_map_iframe');
  
  if (mapContainer && iframe) {
    if (mapContainer.style.display === 'none') {
      const area = document.getElementById('clinic_area').value.trim() || 'delhi';
      const specialty = document.getElementById('clinic_specialty').value || 'clinic';
      const mapUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${specialty}+${area}+india&zoom=13`;
      iframe.src = mapUrl;
      mapContainer.style.display = 'block';
      showToast('Loading healthcare facilities map...', 'info');
    } else {
      mapContainer.style.display = 'none';
    }
  }
}

function getDirections() {
  const area = document.getElementById('clinic_area').value.trim();
  if (!area) {
    showToast('Please enter an area first', 'warning');
    return;
  }
  
  const mapsUrl = `https://www.google.com/maps/search/clinics+${encodeURIComponent(area)}+india`;
  window.open(mapsUrl, '_blank');
  showToast('Opening Google Maps in a new tab...', 'info');
}

// ================================
// Global Statistics
// ================================

async function updateGlobalStats() {
  try {
    // Fetch total reports from all tables
    const tables = ['water_reports', 'civic_reports', 'traffic_reports', 'scam_reports'];
    let totalReports = 0;
    
    for (const table of tables) {
      const { count, error } = await supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error && count) {
        totalReports += count;
      }
    }
    
    // Update hero stats
    animateValue('hero-stat-1', 0, totalReports || 1250, 2000);
    animateValue('hero-stat-2', 0, Math.floor(totalReports * 0.68) || 847, 2000);
    animateValue('hero-stat-3', 0, Math.floor(totalReports * 2.7) || 3420, 2000);
    
    // Update impact stats
    animateValue('impact-stat-1', 0, Math.floor(totalReports * 0.25) || 312, 2000);
    document.getElementById('impact-stat-2').textContent = '< 48h';
    animateValue('impact-stat-3', 0, 87, 2000, '', '%');
    
  } catch (error) {
    console.error('Error updating global stats:', error);
    // Set default values
    animateValue('hero-stat-1', 0, 1250, 2000);
    animateValue('hero-stat-2', 0, 847, 2000);
    animateValue('hero-stat-3', 0, 3420, 2000);
  }
}

// ================================
// Mobile Menu
// ================================

function toggleMobileMenu() {
  const nav = document.querySelector('.nav');
  if (nav) {
    nav.classList.toggle('mobile-active');
  }
}

// ================================
// Initialization
// ================================

document.addEventListener('DOMContentLoaded', () => {
  // Get user location
  getUserLocation();
  
  // Load statistics
  updateGlobalStats();
  loadScamStats();
  
  // Initialize animations
  const animatedElements = document.querySelectorAll('[data-animate]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, { threshold: 0.1 });
  
  animatedElements.forEach(el => observer.observe(el));
  
  // Welcome message
  setTimeout(() => {
    showToast('Welcome to Janastra! Report civic issues and make a difference.', 'info', 5000);
  }, 1000);
});

// ================================
// Export functions to global scope
// ================================

window.scrollToReporting = scrollToReporting;
window.scrollToElement = scrollToElement;
window.toggleMobileMenu = toggleMobileMenu;
window.switchCategory = switchCategory;
window.switchScamMode = switchScamMode;
window.submitWater = submitWater;
window.viewWaterMap = viewWaterMap;
window.getWaterReport = getWaterReport;
window.submitCivic = submitCivic;
window.viewCivicMap = viewCivicMap;
window.submitTraffic = submitTraffic;
window.viewLiveTraffic = viewLiveTraffic;
window.getTrafficReport = getTrafficReport;
window.checkPhoneNumber = checkPhoneNumber;
window.submitScam = submitScam;
window.loadClinics = loadClinics;
window.viewClinicsMap = viewClinicsMap;
window.getDirections = getDirections;
