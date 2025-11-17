-- Function to increment share views
CREATE OR REPLACE FUNCTION increment_share_views(share_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE shared_documents
  SET views_count = views_count + 1
  WHERE shared_documents.share_token = increment_share_views.share_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
