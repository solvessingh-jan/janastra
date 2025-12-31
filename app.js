// 🔐 SUPABASE CONFIG
const SUPABASE_URL = "https://kjptsgmdnmjzrgetneiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// TAB SWITCH
function show(id) {
  document.querySelectorAll("section").forEach(s => s.hidden = true);
  document.getElementById(id).hidden = false;
  document.getElementById("output").innerText = "";
}

// WATER
async function submitWater() {
  const area = document.getElementById("water_area").value;
  const status = document.getElementById("water_status").value;

  const { error } = await supabase.from("water_reports").insert([{ area, status }]);
  document.getElementById("output").innerText = error ? error.message : "Water report submitted";
}

// CIVIC
async function submitCivic() {
  const area = document.getElementById("civic_area").value;
  const category = document.getElementById("civic_category").value;
  const description = document.getElementById("civic_desc").value;

  const { error } = await supabase.from("civic_complaints").insert([
    { area, category, description, status: "open" }
  ]);

  document.getElementById("output").innerText = error ? error.message : "Civic complaint submitted";
}

// TRAFFIC
async function submitTraffic() {
  const area = document.getElementById("traffic_area").value;
  const issue = document.getElementById("traffic_issue").value;

  const { error } = await supabase.from("traffic_reports").insert([{ area, issue }]);
  document.getElementById("output").innerText = error ? error.message : "Traffic report submitted";
}

// SCAM
async function submitScam() {
  const area = document.getElementById("scam_area").value;
  const description = document.getElementById("scam_desc").value;

  const { error } = await supabase.from("scam_reports").insert([{ area, description }]);
  document.getElementById("output").innerText = error ? error.message : "Scam reported";
}

// CLINICS
async function loadClinics() {
  const area = document.getElementById("clinic_area").value;

  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .ilike("area", `%${area}%`);

  document.getElementById("output").innerText =
    error ? error.message : JSON.stringify(data, null, 2);
}
