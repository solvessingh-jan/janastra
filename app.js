// ⚠️ REPLACE WITH YOUR SUPABASE PROJECT CREDENTIALS
const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5';

// Initialize Supabase client from global CDN object
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let clinicsChannel = null;

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
    document.querySelectorAll('input, textarea').forEach(input => input.value = '');
    
  } catch (error) {
    output.textContent = `❌ Error: ${error.message}\n\nPlease check your connection and try again.`;
    output.className = 'output error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '📤 Submit Report';
  }
}

// Water report
async function submitWater() {
  const area = document.getElementById('water_area').value.trim();
  const status = document.getElementById('water_status').value.trim();
  
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

// Civic complaint
async function submitCivic() {
  const area = document.getElementById('civic_area').value.trim();
  const category = document.getElementById('civic_category').value.trim();
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

// Traffic report
async function submitTraffic() {
  const area = document.getElementById('traffic_area').value.trim();
  const issue = document.getElementById('traffic_issue').value.trim();

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

// Scam report
async function submitScam() {
  const area = document.getElementById('scam_area').value.trim();
  const desc = document.getElementById('scam_desc').value.trim();

  if (!area || !desc) {
    showMessage('Please fill all fields', 'error');
    return;
  }

  await submitReport('scam_reports', {
    area,
    description: desc,
    reported_at: new Date().toISOString()
  });
}

// Load clinics with realtime updates
async function loadClinics() {
  const area = document.getElementById('clinic_area').value.trim();
  const output = document.getElementById('output');

  if (!area) {
    showMessage('Please enter your area', 'error');
    return;
  }

  output.textContent = '🔍 Searching for clinics nearby...';
  output.className = 'output loading';

  // Unsubscribe previous channel
  if (clinicsChannel) {
    supabaseClient.removeChannel(clinicsChannel);
  }

  // Fetch clinics
  const { data, error } = await supabaseClient
    .from('clinics')
    .select('id, name, address, phone, specialty')
    .ilike('area', `%${area}%`)
    .order('name', { ascending: true });

  if (error) {
    output.textContent = `❌ Error: ${error.message}`;
    output.className = 'output error';
    return;
  }

  if (!data || data.length === 0) {
    output.textContent = `No clinics found in "${area}".\n\nTry a nearby area or add one!`;
    output.className = 'output';
    return;
  }

  // Display clinics in beautiful format
  const clinicsList = data.map(clinic => 
    `🏥 ${clinic.name}\n📍 ${clinic.address}\n📞 ${clinic.phone || 'N/A'}\n${clinic.specialty ? `🔧 ${clinic.specialty}` : ''}`
  ).join('\n\n───\n\n');

  output.textContent = `Found ${data.length} clinic(s) in "${area}":\n\n${clinicsList}`;
  output.className = 'output success';

  // Realtime subscription for new clinics
  clinicsChannel = supabaseClient
    .channel('clinics')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'clinics',
      filter: `area=ilike.${area}%`
    }, (payload) => {
      output.textContent += `\n\n✨ **New clinic added realtime!**\n🏥 ${payload.new.name}`;
    })
    .subscribe();
}

// Utility function for quick messages
function showMessage(message, type = 'error') {
  const output = document.getElementById('output');
  output.textContent = message;
  output.className = 'output ' + type;
}

// Auto-focus first input on tab change
document.addEventListener('DOMContentLoaded', () => {
  const firstInput = document.querySelector('#water input');
  if (firstInput) firstInput.focus();
});
