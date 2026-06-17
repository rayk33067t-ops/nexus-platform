const integrations = {
  database: { provider:"supabase", url:process.env.SUPABASE_URL },
  payments: { provider:"stripe", key:process.env.STRIPE_KEY },
  hosting:  { provider:"vercel" },
  ai:       { provider:"openai", key:process.env.OPENAI_KEY }
};
export default integrations;
