document.addEventListener('DOMContentLoaded', () => {

  // ===============================
  // SUPABASE CONFIG (CHANGE ONLY THIS)
  // ===============================
  const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
  const SUPABASE_KEY = 'YOUR_ANON_PUBLIC_KEY';

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  // ===============================
  // WATER REPORT
  // Table: water_reports
  // Columns: area, status
  // ===============================
  document.getElementById('submitWater').onclick = async () => {
    const area = document.getElementById('waterArea').value;
    const status = document.getElementById('waterStatus').value;

    const { error } = await supabase
      .from('water_reports')
      .insert([{ area, status }]);

    document.getElementById('waterResult').innerText =
      error ? error.message : 'Water report submitted';
  };

  // ===============================
  // CIVIC COMPLAINT
  // Table: civic_complaints
  // Columns: category, description, status
  // ===============================
  document.getElementById('submitCivic').onclick = async () => {
    const category = document.getElementById('civicCategory').value;
    const description = document.getElementById('civicDescription').value;

    const { error } = await supabase
      .from('civic_complaints')
      .insert([
        {
          category,
          description,
          status: 'Open'
        }
      ]);

    document.getElementById('civicResult').innerText =
      error ? error.message : 'Civic complaint submitted';
  };

  // ===============================
  // TRAFFIC / ROAD REPORT
  // Table: traffic_reports
  // Columns: location, issue
  // ===============================
  document.getElementById('submitTraffic').onclick = async () => {
    const location = document.getElementById('trafficLocation').value;
    const issue = document.getElementById('trafficIssue').value;

    const { error } = await supabase
      .from('traffic_reports')
      .insert([{ location, issue }]);

    document.getElementById('trafficResult').innerText =
      error ? error.message : 'Traffic issue reported';
  };

  // ===============================
  // SCAM REPORT
  // Table: scam_reports
  // Columns: scam_type, details
  // ===============================
  document.getElementById('submitScam').onclick = async () => {
    const scam_type = document.getElementById('scamType').value;
    const details = document.getElementById('scamDetails').value;

    const { error } = await supabase
      .from('scam_reports')
      .insert([{ scam_type, details }]);

    document.getElementById('scamResult').innerText =
      error ? error.message : 'Scam reported successfully';
  };

  // ===============================
  // CLINICS (READ ONLY)
  // Table: clinics
  // Columns: name, area, cost_level
  // ===============================
  document.getElementById('loadClinics').onclick = async () => {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .limit(10);

    document.getElementById('clinicResult').innerText =
      error ? error.message : JSON.stringify(data, null, 2);
  };

});
