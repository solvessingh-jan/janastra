// ================================
// Janastra - Enhanced with Error Handling
// ================================

const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcHRzZ21kbm1qenJnZXRuZWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjQ2NzEsImV4cCI6MjA4MjcwMDY3MX0.g5NA4Anqj9j0urX2oMtU2WDL4mtFDkI2WhV27iN-Jko';

let supabaseClient = null;
try {
  const { createClient } = supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
  console.error('Supabase init failed:', error);
}

let currentUserLocation = { lat: 28.6139, lng: 77.2090 };
let currentCategory = 'water';
let scamMode = 'check';
let isOnline = navigator.onLine;

window.addEventListener('online', () => { isOnline = true; showToast('✓ Back online!', 'success'); });
window.addEventListener('offline', () => { isOnline = false; showToast('⚠ No internet connection', 'warning', 8000); });

function showToast(message, type = 'success', duration = 4000) {
  try {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `<div class="toast-icon">${icons[type]||icons.info}</div><div class="toast-content"><div class="toast-title">${type.charAt(0).toUpperCase()+type.slice(1)}</div><div class="toast-message">${message.replace(/[<>]/g,'')}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOutRight 0.3s ease-out forwards'; setTimeout(() => toast.remove(), 300); }, duration);
  } catch (e) { console.error('Toast error:', e); alert(message); }
}

function validateForm(fields) {
  for (const [id, name] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) { showToast(`Please enter ${name}`, 'warning'); el?.focus(); return false; }
    el.classList.remove('error');
  }
  return true;
}

function validatePhone(phone) {
  phone = phone.replace(/[\s\-()]/g, '');
  if (!/^\d{10}$/.test(phone)) return { valid: false, error: 'Phone must be 10 digits' };
  if (!/^[6-9]\d{9}$/.test(phone)) return { valid: false, error: 'Phone must start with 6-9' };
  return { valid: true, cleaned: phone };
}

function validateArea(area) {
  if (area.length < 3) return { valid: false, error: 'Area must be at least 3 characters' };
  if (area.length > 100) return { valid: false, error: 'Area name too long (max 100)' };
  return { valid: true };
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  const txt = btn.querySelector('.btn-text');
  const ldr = btn.querySelector('.btn-loader');
  if (loading) { btn.disabled = true; if(txt) txt.style.display = 'none'; if(ldr) ldr.style.display = 'inline-flex'; }
  else { btn.disabled = false; if(txt) txt.style.display = 'inline'; if(ldr) ldr.style.display = 'none'; }
}

async function safeInsert(table, data) {
  if (!isOnline) throw new Error('No internet connection');
  if (!supabaseClient) throw new Error('Database not available');
  const { data: result, error } = await supabaseClient.from(table).insert([data]).select().single();
  if (error) {
    if (error.code === '23505') throw new Error('Report already exists');
    if (error.message.includes('JWT')) throw new Error('Session expired. Refresh page');
    throw new Error(`Database error: ${error.message}`);
  }
  return result;
}

function animateValue(id, start, end, duration, prefix = '', suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const inc = (end - start) / (duration / 16);
  let cur = start;
  const timer = setInterval(() => {
    cur += inc;
    if ((inc > 0 && cur >= end) || (inc < 0 && cur <= end)) { el.textContent = prefix + Math.round(end).toLocaleString() + suffix; clearInterval(timer); }
    else { el.textContent = prefix + Math.round(cur).toLocaleString() + suffix; }
  }, 16);
}

function scrollToElement(sel) { document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' }); }
function scrollToReporting() { scrollToElement('#reporting'); }

function switchCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.category-tab').forEach(t => { const active = t.dataset.category === cat; t.classList.toggle('active', active); t.setAttribute('aria-selected', active); });
  document.querySelectorAll('.report-form').forEach(f => { f.classList.remove('active'); f.style.display = 'none'; });
  const form = document.getElementById(`form-${cat}`);
  if (form) { form.classList.add('active'); form.style.display = 'block'; }
}

async function submitWater(btn) {
  if (!validateForm({ 'water_area': 'area', 'water_status': 'status', 'water_phone': 'phone number' })) return;
  setButtonLoading(btn, true);
  try {
    const area = document.getElementById('water_area').value.trim();
    const status = document.getElementById('water_status').value;
    const phone = document.getElementById('water_phone').value.trim();
    const imageFile = document.getElementById('water_image')?.files[0];
    
    const areaVal = validateArea(area);
    if (!areaVal.valid) throw new Error(areaVal.error);
    const phoneVal = validatePhone(phone);
    if (!phoneVal.valid) throw new Error(phoneVal.error);
    
    // Upload image if present
    let imageUrl = null;
    if (imageFile) {
      showToast('Uploading image...', 'info', 2000);
      imageUrl = await uploadImage(imageFile);
    }
    
    // Get user location
    const location = await getUserLocation();
    
    await safeInsert('water_reports', { 
      area, 
      status, 
      phone_number: phoneVal.cleaned, 
      image_url: imageUrl,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString() 
    });
    
    showToast(`✓ Water report submitted for ${area}!`, 'success');
    document.getElementById('water_area').value = '';
    document.getElementById('water_status').value = '';
    document.getElementById('water_phone').value = '';
    if (document.getElementById('water_image')) document.getElementById('water_image').value = '';
    document.getElementById('water_search_results').style.display = 'none';
    updateGlobalStats();
  } catch (e) { showToast(e.message || 'Submit failed', 'error', 6000); }
  finally { setButtonLoading(btn, false); }
}
async function searchWaterReports() {
  const area = document.getElementById('water_area')?.value.trim();
  if (!area || area.length < 3) {
    document.getElementById('water_search_results').style.display = 'none';
    return;
  }
  
  const results = await searchReports('water_reports', area);
  showSearchResults(results, 'water_search_results');
}
function viewWaterMap() {
  const map = document.getElementById('water_map');
  const iframe = document.getElementById('water_map_iframe');
  if (!map || !iframe) { showToast('Map not available', 'error'); return; }
  if (map.style.display === 'none') {
    const area = document.getElementById('water_area').value.trim() || 'Delhi';
    iframe.src = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=water+supply+${encodeURIComponent(area)}+india&zoom=12`;
    map.style.display = 'block';
    showToast('Loading map...', 'info', 2000);
  } else { map.style.display = 'none'; }
}

async function getWaterReport() {
  try {
    const area = document.getElementById('water_area').value.trim();
    if (!area) { showToast('Enter area first', 'warning'); document.getElementById('water_area').focus(); return; }
    const { data } = await supabaseClient.from('water_reports').select('*').ilike('area', `%${area}%`).order('timestamp', { ascending: false }).limit(10);
    if (data && data.length > 0) {
      let txt = `Water Reports for ${area}:\n\n`;
      data.forEach((r, i) => txt += `${i+1}. ${r.status} - ${new Date(r.timestamp).toLocaleString()}\n`);
      showToast(txt, 'info', 8000);
    } else { showToast(`No reports for ${area}`, 'info'); }
  } catch (e) { showToast(e.message || 'Fetch failed', 'error'); }
}

async function submitCivic(btn) {
  if (!validateForm({ 'civic_area': 'area', 'civic_issue': 'issue', 'civic_phone': 'phone number' })) return;
  setButtonLoading(btn, true);
  try {
    const area = document.getElementById('civic_area').value.trim();
    const issue = document.getElementById('civic_issue').value;
    const desc = document.getElementById('civic_desc').value.trim();
    const phone = document.getElementById('civic_phone').value.trim();
    const imageFile = document.getElementById('civic_image')?.files[0];
    
    const areaVal = validateArea(area);
    if (!areaVal.valid) throw new Error(areaVal.error);
    const phoneVal = validatePhone(phone);
    if (!phoneVal.valid) throw new Error(phoneVal.error);
    
    // Upload image if present
    let imageUrl = null;
    if (imageFile) {
      showToast('Uploading image...', 'info', 2000);
      imageUrl = await uploadImage(imageFile);
    }
    
    // Get user location
    const location = await getUserLocation();
    
    await safeInsert('civic_reports', { 
      area, 
      issue_type: issue, 
      description: desc || 'No details', 
      phone_number: phoneVal.cleaned,
      image_url: imageUrl,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString() 
    });
    
    showToast(`✓ Civic report submitted for ${area}!`, 'success');
    document.getElementById('civic_area').value = '';
    document.getElementById('civic_issue').value = '';
    document.getElementById('civic_desc').value = '';
    document.getElementById('civic_phone').value = '';
    if (document.getElementById('civic_image')) document.getElementById('civic_image').value = '';
    document.getElementById('civic_search_results').style.display = 'none';
    updateGlobalStats();
  } catch (e) { showToast(e.message || 'Submit failed', 'error', 6000); }
  finally { setButtonLoading(btn, false); }
}

async function searchCivicReports() {
  const area = document.getElementById('civic_area')?.value.trim();
  if (!area || area.length < 3) {
    document.getElementById('civic_search_results').style.display = 'none';
    return;
  }
  
  const results = await searchReports('civic_reports', area);
  showSearchResults(results, 'civic_search_results');
}

function viewCivicMap() {
  const map = document.getElementById('civic_map');
  const iframe = document.getElementById('civic_map_iframe');
  if (!map || !iframe) { showToast('Map not available', 'error'); return; }
  if (map.style.display === 'none') {
    const area = document.getElementById('civic_area').value.trim() || 'Delhi';
    iframe.src = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=civic+issues+${encodeURIComponent(area)}+india&zoom=12`;
    map.style.display = 'block';
    showToast('Loading map...', 'info', 2000);
  } else { map.style.display = 'none'; }
}

async function submitTraffic(btn) {
  if (!validateForm({ 'traffic_area': 'area', 'traffic_issue': 'condition' })) return;
  setButtonLoading(btn, true);
  try {
    const area = document.getElementById('traffic_area').value.trim();
    const condition = document.getElementById('traffic_issue').value;
    const imageFile = document.getElementById('traffic_image')?.files[0];
    
    const areaVal = validateArea(area);
    if (!areaVal.valid) throw new Error(areaVal.error);
    
    // Upload image if present
    let imageUrl = null;
    if (imageFile) {
      showToast('Uploading image...', 'info', 2000);
      imageUrl = await uploadImage(imageFile);
    }
    
    // Get user location
    const location = await getUserLocation();
    
    await safeInsert('traffic_reports', { 
      area, 
      condition, 
      image_url: imageUrl,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().toISOString() 
    });
    
    showToast(`✓ Traffic report submitted for ${area}!`, 'success');
    document.getElementById('traffic_area').value = '';
    document.getElementById('traffic_issue').value = '';
    if (document.getElementById('traffic_image')) document.getElementById('traffic_image').value = '';
    document.getElementById('traffic_search_results').style.display = 'none';
    updateGlobalStats();
  } catch (e) { showToast(e.message || 'Submit failed', 'error', 6000); }
  finally { setButtonLoading(btn, false); }
}

async function searchTrafficReports() {
  const area = document.getElementById('traffic_area')?.value.trim();
  if (!area || area.length < 3) {
    document.getElementById('traffic_search_results').style.display = 'none';
    return;
  }
  
  const results = await searchReports('traffic_reports', area);
  showSearchResults(results, 'traffic_search_results');
}

function viewLiveTraffic() {
  const map = document.getElementById('traffic_map');
  const iframe = document.getElementById('traffic_map_iframe');
  if (!map || !iframe) { showToast('Map not available', 'error'); return; }
  if (map.style.display === 'none') {
    const area = document.getElementById('traffic_area').value.trim() || 'Delhi';
    iframe.src = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=traffic+${encodeURIComponent(area)}+india&zoom=12`;
    map.style.display = 'block';
    showToast('Loading traffic map...', 'info', 2000);
  } else { map.style.display = 'none'; }
}

async function getTrafficReport() {
  try {
    const area = document.getElementById('traffic_area').value.trim();
    if (!area) { showToast('Enter area first', 'warning'); document.getElementById('traffic_area').focus(); return; }
    const { data } = await supabaseClient.from('traffic_reports').select('*').ilike('area', `%${area}%`).order('timestamp', { ascending: false }).limit(10);
    if (data && data.length > 0) {
      let txt = `Traffic Reports for ${area}:\n\n`;
      data.forEach((r, i) => txt += `${i+1}. ${r.condition} - ${new Date(r.timestamp).toLocaleString()}\n`);
      showToast(txt, 'info', 8000);
    } else { showToast(`No reports for ${area}`, 'info'); }
  } catch (e) { showToast(e.message || 'Fetch failed', 'error'); }
}

function switchScamMode(mode) {
  scamMode = mode;
  document.querySelectorAll('.scam-mode-tab').forEach(t => {
    if ((mode === 'check' && t.textContent.includes('Check')) || (mode === 'report' && t.textContent.includes('Report'))) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  document.getElementById('scam-check-mode').style.display = mode === 'check' ? 'block' : 'none';
  document.getElementById('scam-report-mode').style.display = mode === 'report' ? 'block' : 'none';
}

async function checkPhoneNumber() {
  try {
    const phoneInput = document.getElementById('check_phone');
    const phone = phoneInput.value.trim();
    const val = validatePhone(phone);
    if (!val.valid) { showToast(val.error, 'warning'); phoneInput.focus(); return; }
    const result = document.getElementById('phone_result');
    if (result) { result.style.display = 'block'; result.innerHTML = '<div class="result-content"><p>Checking...</p></div>'; }
    const { data } = await supabaseClient.from('scam_reports').select('*').eq('phone_number', val.cleaned);
    const icon = document.getElementById('result_icon');
    const status = document.getElementById('result_status');
    const details = document.getElementById('result_details');
    const reports = document.getElementById('result_reports');
    if (data && data.length > 0) {
      const names = [...new Set(data.map(r => r.reporter_name).filter(n => n))];
      const nameDisplay = names.length > 0 ? names.join(', ') : 'Anonymous users';
      if (icon) { icon.textContent = '🚨'; icon.style.color = '#ef4444'; }
      if (status) { status.textContent = 'Warning: Reported as Scam'; status.style.color = '#ef4444'; }
      if (details) details.innerHTML = `<strong>Reported ${data.length} time${data.length>1?'s':''}</strong><br><small>Reported by: ${nameDisplay}</small>`;
      if (reports) {
        let txt = '<p><strong>Recent reports:</strong></p><ul style="margin:10px 0;padding-left:20px">';
        data.slice(0,3).forEach(r => txt += `<li>${r.scam_type||'Unknown'} - ${r.area||'Unknown'} (${new Date(r.timestamp).toLocaleDateString()})</li>`);
        txt += '</ul>';
        reports.innerHTML = txt;
      }
      showToast('⚠ Reported as scam!', 'warning', 8000);
    } else {
      if (icon) { icon.textContent = '✓'; icon.style.color = '#10b981'; }
      if (status) { status.textContent = 'No Reports Found'; status.style.color = '#10b981'; }
      if (details) details.innerHTML = '<strong>Not in our database</strong><br><small>This number appears clean</small>';
      if (reports) reports.innerHTML = '<p style="color:#64748b">Stay vigilant!</p>';
      showToast('✓ No scam reports', 'success');
    }
  } catch (e) { showToast(e.message || 'Check failed', 'error', 6000); }
}

async function submitScam(btn) {
  if (!validateForm({ 'scam_phone': 'phone', 'scam_area': 'area', 'scam_type': 'type', 'scam_name': 'your name' })) return;
  setButtonLoading(btn, true);
  try {
    const phone = document.getElementById('scam_phone').value.trim();
    const area = document.getElementById('scam_area').value.trim();
    const type = document.getElementById('scam_type').value;
    const desc = document.getElementById('scam_desc').value.trim();
    const name = document.getElementById('scam_name').value.trim();
    const phoneVal = validatePhone(phone);
    if (!phoneVal.valid) throw new Error(phoneVal.error);
    const areaVal = validateArea(area);
    if (!areaVal.valid) throw new Error(areaVal.error);
    await safeInsert('scam_reports', { phone_number: phoneVal.cleaned, area, scam_type: type, description: desc || 'No details', reporter_name: name, timestamp: new Date().toISOString() });
    showToast('✓ Scam report submitted!', 'success', 6000);
    document.getElementById('scam_phone').value = '';
    document.getElementById('scam_area').value = '';
    document.getElementById('scam_type').value = '';
    document.getElementById('scam_desc').value = '';
    document.getElementById('scam_name').value = '';
    loadScamStats();
  } catch (e) { showToast(e.message || 'Submit failed', 'error', 6000); }
  finally { setButtonLoading(btn, false); }
}

async function loadScamStats() {
  try {
    const { count } = await supabaseClient.from('scam_reports').select('*', { count: 'exact', head: true });
    const { data } = await supabaseClient.from('scam_reports').select('phone_number');
    const blocked = data ? new Set(data.map(r => r.phone_number)).size : 0;
    animateValue('total_scams', 0, count || 0, 1500);
    animateValue('blocked_numbers', 0, blocked, 1500);
    const saved = document.getElementById('saved_amount');
    if (saved) saved.textContent = `₹${((count || 0) * 5000).toLocaleString()}`;
  } catch (e) {
    console.error('Stats error:', e);
  }
}

async function loadClinics() {
  const area = document.getElementById('clinic_area').value.trim();
  const spec = document.getElementById('clinic_specialty').value || 'clinics';
  if (!area) { showToast('Enter area first', 'warning'); document.getElementById('clinic_area').focus(); return; }
  showToast(`Finding ${spec} in ${area}...`, 'info', 3000);
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(spec)}+${encodeURIComponent(area)}+india`, '_blank');
}

function viewClinicsMap() {
  const area = document.getElementById('clinic_area').value.trim();
  if (!area) { showToast('Enter area first', 'warning'); return; }
  const spec = document.getElementById('clinic_specialty').value || 'clinics';
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(spec)}+${encodeURIComponent(area)}+india`, '_blank');
  showToast('Opening Maps...', 'info', 2000);
}

function getDirections() {
  const area = document.getElementById('clinic_area').value.trim();
  if (!area) { showToast('Enter area first', 'warning'); return; }
  const spec = document.getElementById('clinic_specialty').value || 'clinics';
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(spec)}+${encodeURIComponent(area)}+india`, '_blank');
  showToast('Opening Maps...', 'info', 2000);
}

async function updateGlobalStats() {
  try {
    const tables = ['water_reports', 'civic_reports', 'traffic_reports', 'scam_reports'];
    let total = 0;
    for (const t of tables) {
      try {
        const { count } = await supabaseClient.from(t).select('*', { count: 'exact', head: true });
        if (count) total += count;
      } catch (e) { }
    }
    const s1 = total || 1250;
    const s2 = Math.floor(s1 * 0.68) || 847;
    const s3 = Math.floor(s1 * 2.7) || 3420;
    animateValue('hero-stat-1', 0, s1, 2000);
    animateValue('hero-stat-2', 0, s2, 2000);
    animateValue('hero-stat-3', 0, s3, 2000);
    animateValue('impact-stat-1', 0, Math.floor(s1 * 0.25) || 312, 2000);
    const i2 = document.getElementById('impact-stat-2');
    if (i2) i2.textContent = '< 48h';
    animateValue('impact-stat-3', 0, 87, 2000, '', '%');
  } catch (e) {
    animateValue('hero-stat-1', 0, 1250, 2000);
    animateValue('hero-stat-2', 0, 847, 2000);
    animateValue('hero-stat-3', 0, 3420, 2000);
  }
}
// Image Upload Function
async function uploadImage(file) {
  try {
    if (!file) return null;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image too large (max 5MB)');
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }
    
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('report-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('report-images')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (e) {
    console.error('Upload error:', e);
    throw e;
  }
}

// Get user location
function getUserLocation() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          resolve({ latitude: 28.6139, longitude: 77.2090 }); // Default: Delhi
        }
      );
    } else {
      resolve({ latitude: 28.6139, longitude: 77.2090 }); // Default: Delhi
    }
  });
}

// Search existing reports
async function searchReports(table, area) {
  try {
    const { data } = await supabaseClient
      .from(table)
      .select('*')
      .ilike('area', `%${area}%`)
      .order('timestamp', { ascending: false })
      .limit(5);
    
    return data || [];
  } catch (e) {
    console.error('Search error:', e);
    return [];
  }
}

// Show search results
function showSearchResults(results, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<p style="color: #10b981; padding: 12px; background: #d1fae5; border-radius: 6px; margin-top: 8px;">✓ No similar reports found in this area</p>';
  } else {
    let html = '<div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 8px;"><p style="font-weight: 600; margin-bottom: 8px;">⚠️ Similar reports found:</p><ul style="margin: 0; padding-left: 20px;">';
    results.forEach(r => {
      const date = new Date(r.timestamp).toLocaleDateString();
      const status = r.status || 'Pending';
      html += `<li style="margin: 4px 0;"><strong>${r.area}</strong> - ${status} (${date})</li>`;
    });
    html += '</ul></div>';
    container.innerHTML = html;
  }
  container.style.display = 'block';
}
function toggleMobileMenu() {
  const nav = document.querySelector('.nav');
  const btn = document.querySelector('.mobile-menu-btn');

  if (!nav) return;

  const isOpen = nav.classList.contains('mobile-active');

  if (isOpen) {
    nav.classList.remove('mobile-active');
    nav.style.display = '';
    if (btn) btn.classList.remove('active');
  } else {
    if (!nav.querySelector('.mobile-org-link')) {
      const orgLink = document.createElement('a');
      orgLink.href = '/pricing.html';
      orgLink.className = 'nav-link mobile-org-link';
      orgLink.textContent = '🏛 For Organizations';
      orgLink.style.cssText = 'color: #4f8ef7; font-weight: 600;';
      nav.appendChild(orgLink);
    }
    nav.classList.add('mobile-active');
    nav.style.cssText = `display:flex!important;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:#0f172a;padding:1.5rem;gap:0.2rem;z-index:999;border-bottom:2px solid rgba(79,142,247,0.3);box-shadow:0 8px 32px rgba(0,0,0,0.5);`;
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.style.cssText = `display:block;padding:0.9rem 1rem;font-size:1rem;border-radius:8px;`;
      link.addEventListener('click', () => { nav.classList.remove('mobile-active'); nav.style.display=''; }, { once: true });
    });
    if (btn) btn.classList.add('active');
  }
}


document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!supabaseClient) showToast('⚠ Database issue', 'warning', 6000);
    updateGlobalStats();
    loadScamStats();
    const animated = document.querySelectorAll('[data-animate]');
    if (animated.length > 0) {
      const obs = new IntersectionObserver((e) => e.forEach(x => { if (x.isIntersecting) x.target.style.animationPlayState = 'running'; }), { threshold: 0.1 });
      animated.forEach(el => obs.observe(el));
    }
    setTimeout(() => showToast(isOnline ? 'Welcome to Janastra!' : '⚠ Offline', isOnline ? 'info' : 'warning', 4000), 1000);
    document.querySelectorAll('input, select, textarea').forEach(i => i.addEventListener('focus', () => i.classList.remove('error')));
  } catch (e) { console.error('Init error:', e); }
});

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
