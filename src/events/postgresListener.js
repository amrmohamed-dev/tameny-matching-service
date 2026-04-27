import { createClient } from '@supabase/supabase-js';

const PostgresListener = () => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const REALTIME_EVENTS_FILTER = {
    event: 'INSERT',
    schema: 'public',
    table: 'realtime_events',
  };

  supabase
    .channel('realtime-events-listener')
    .on('postgres_changes', REALTIME_EVENTS_FILTER, async (payload) => {
      try {
        //debug only
        console.log('[RealtimeListener] Full payload:', payload);
      } catch (err) {
        console.error('[RealtimeListener] Error:', err);
      }
    })
    .subscribe((status) => {
      console.log('[RealtimeListener]: Channel status:', status);
    });
};

export default PostgresListener;
