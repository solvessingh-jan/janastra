document.addEventListener('DOMContentLoaded', () => {

  // 1. Supabase project details
  const SUPABASE_URL = 'https://kjptsgmdnmjzrgetneiz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_tK95wQr1Lf4mLJQSdWHVuQ_52Mag0_5';

  // 2. Create Supabase client
  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  // 3. Button click test
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

});
