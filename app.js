// ===============================
// 1. SUPABASE CONFIG (REPLACE)
// ===============================
const SUPABASE_URL = "https://kjptsgmdnmjzrgetneiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5";

// ===============================
// 2. CREATE CLIENT
// ===============================
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const output = document.getElementById("output");

// ===============================
// 3. WATER REPORT
// ===============================
document.getElementById("submitWater").onclick = async () => {
  const area = document.getElementById("waterArea").value;
  const status = document.getElementById("waterStatus").value;

  const { error } = await supabase
    .from("water_reports")
    .insert([{ area, status }]);

  output.textContent = error ? error.message : "Water report submitted";
};

// ===============================
// 4. CIVIC COMPLAINT
// ===============================
document.getElementById("submitCivic").onclick = async () => {
  const area = document.getElementById("civicArea").value;
  const category = document.getElementById("civicCategory").value;
  const description = document.getElementById("civicDesc").value;

  const { error } = await supabase
    .from("civic_complaints")
    .insert([{ area, category, description }]);

  output.textContent = error ? error.message : "Civic complaint submitted";
};

// ===============================
// 5. TRAFFIC REPORT
// ===============================
document.getElementById("submitTraffic").onclick = async () => {
  const area = document.getElementById("trafficArea").value;
  const issue = document.getElementById("trafficIssue").value;

  const { error } = await supabase
    .from("traffic_reports")
    .insert([{ area, issue }]);

  output.textContent = error ? error.message : "Traffic report submitted";
};

// ===============================
// 6. SCAM REPORT
// ===============================
document.getElementById("submitScam").onclick = async () => {
  const area = document.getElementById("scamArea").value;
  const description = document.getElementById("scamDesc").value;

  const { error } = await supabase
    .from("scam_reports")
    .insert([{ area, description }]);

  output.textContent = error ? error.message : "Scam report submitted";
};

// ===============================
// 7. CLINICS
// ===============================
document.getElementById("submitClinic").onclick = async () => {
  const name = document.getElementById("clinicName").value;
  const area = document.getElementById("clinicArea").value;
  const type = document.getElementById("clinicType").value;

  const { error } = await supabase
    .from("clinics")
    .insert([{ name, area, type }]);

  output.textContent = error ? error.message : "Clinic added";
};
