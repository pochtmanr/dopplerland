const fetch = require('node-fetch');

const SUPABASE_URL = 'https://fzlrhmjdjjzcgstaeblu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bHJobWpkamp6Y2dzdGFlYmx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI5NzQ5NCwiZXhwIjoyMDQ5ODczNDk0fQ.C8zuucvCkO3SYpg7MbE2hBR4lTiQQjOo0BpABQjMy1I';

async function initializeVenus() {
    console.log('🪐 Venus loading shared memory context...');
    
    try {
        const rosterResponse = await fetch(`${SUPABASE_URL}/rest/v1/agent_roster?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const roster = await rosterResponse.json();
        
        console.log('\n📋 Team Roster:');
        roster.forEach(agent => {
            console.log(`  ${agent.emoji} ${agent.agent_name} - ${agent.role}`);
        });
        
    console.log('\n🎯 URGENT TASKS FOR VENUS:');
        console.log('  1. Fix Simnetiq Vercel builds (return to Jan 7 monorepo)');
        console.log('  2. Test auth & payment flow (make real $5-10 purchase)');
        console.log('  3. Fix VPN connection flow (call WG API, not config_data)');
        
        console.log('\n⚙️  Key Information:');
        console.log('  • Simnetiq Supabase: eujmomonscnlmwcbkbfy.supabase.co');
        console.log('  • GitHub: https://github.com/Simnetiq/esimmain');
        console.log('  • Critical: Admin panel must use Supabase only (no Firebase)');
        
        await fetch(`${SUPABASE_URL}/rest/v1/daily_updates`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agent_name: 'Venus',
                update_type: 'status',
                messaized with shared memory - ready for Simnetiq work'
            })
        });
        
        console.log('\n✅ Venus successfully initialized with shared memory!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

initializeVenus();
