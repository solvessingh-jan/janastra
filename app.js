document.addEventListener('DOMContentLoaded', () => {

  // SUPABASE CONFIG
  const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5';

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  // READ WATER REPORTS
  document.getElementById('waterBtn').onclick = async () => {
    const { data, error } = await supabase
      .from('water_reports')
      .select('*')
      .limit(5);

    const content = document.getElementById('content');

    if (error) {
      content.innerText = 'Error: ' + error.message;
    } else {
      content.innerText = JSON.stringify(data, null, 2);
    }
  };

  // INSERT WATER REPORT
  document.getElementById('submitWater').onclick = async () => {
    const area = document.getElementById('areaInput').value;
    const status = document.getElementById('statusInput').value;

    const { error } = await supabase
      .from('water_reports')
      .insert([{ area, status }]);

    const content = document.getElementById('content');

    if (error) {
      content.innerText = 'Insert error: ' + error.message;
    } else {
      content.innerText = 'Water report submitted successfully';
    }
  };

  // INSERT CIVIC COMPLAINT
  document.getElementById('submitCivic').onclick = async () => {
    const area = document.getElementById('civicArea').value;
    const issue = document.getElementById('civicType').value;
    const description = document.getElementById('civicDesc').value;

    const { error } = await supabase
      .from('civic_complaints')
      .insert([
        {
          area,
          issue,
          description,
          status: 'Open'
        }
      ]);

    const content = document.getElementById('content');

    if (error) {
      content.innerText = 'Civic insert error: ' + error.message;
    } else {
      content.innerText = 'Civic complaint submitted successfully';
    }
  };

});
