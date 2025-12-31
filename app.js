// ================================
// 1. SUPABASE CONFIG
// ================================
const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5';

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const content = document.getElementById('content');

// ================================
// 2. WATER REPORT UI
// ================================
document.getElementById('waterBtn').onclick = () => {
  content.innerHTML = `
    <h2>Submit Water Report</h2>

    <input id="waterArea" placeholder="Area / Locality" /><br><br>
    <input id="waterStatus" placeholder="Water status (No / Low / Normal)" /><br><br>

    <button id="submitWaterBtn">Submit Water Report</button>
    <hr>
    <pre id="waterResult"></pre>
  `;

  document.getElementById('submitWaterBtn').onclick = submitWaterReport;
};

// ================================
// 3. SUBMIT WATER REPORT
// ================================
async function submitWaterReport() {
  const area = document.getElementById('waterArea').value;
  const status = document.getElementById('waterStatus').value;

  const { error } = await supabase
    .from('water_reports')
    .insert([
      {
        area: area,
        status: status
      }
    ]);

  const result = document.getElementById('waterResult');

  if (error) {
    result.innerText = 'Error: ' + error.message;
  } else {
    result.innerText = 'Water report submitted successfully';
  }
}

// ================================
// 4. CIVIC COMPLAINT UI
// ================================
document.getElementById('civicBtn').onclick = () => {
  content.innerHTML = `
    <h2>Submit Civic Complaint</h2>

    <input id="civicArea" placeholder="Area / Sector" /><br><br>
    <input id="civicCategory" placeholder="Category (Garbage, Road, etc)" /><br><br>
    <input id="civicDescription" placeholder="Description" /><br><br>

    <button id="submitCivicBtn">Submit Civic Complaint</button>
    <hr>
    <pre id="civicResult"></pre>
  `;

  document.getElementById('submitCivicBtn').onclick = submitCivicComplaint;
};

// ================================
// 5. SUBMIT CIVIC COMPLAINT
// ================================
async function submitCivicComplaint() {
  const area = document.getElementById('civicArea').value;
  const category = document.getElementById('civicCategory').value;
  const description = document.getElementById('civicDescription').value;

  const { error } = await supabase
    .from('civic_complaints')
    .insert([
      {
        category: category,
        description: `${area} - ${description}`,
        status: 'Open'
      }
    ]);

  const result = document.getElementById('civicResult');

  if (error) {
    result.innerText = 'Error: ' + error.message;
  } else {
    result.innerText = 'Civic complaint submitted successfully';
  }
}
