-- Supabase exposes the public schema through its Data API using the browser
-- (publishable) key. With RLS on and no policies, that API can read or change
-- nothing. The app connects as the table owner over DATABASE_URL, which RLS
-- does not restrict, so server queries are unaffected.
ALTER TABLE "celebrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishnest_schema_migrations" ENABLE ROW LEVEL SECURITY;
