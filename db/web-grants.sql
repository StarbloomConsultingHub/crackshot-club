-- Run as the database owner after creating the dedicated LOGIN role club_web.
GRANT USAGE ON SCHEMA public TO club_web;
GRANT SELECT (id, nickname, pass_hash), INSERT (nickname, pass_hash) ON club_member TO club_web;
GRANT SELECT, DELETE, INSERT (token_hash, member_id) ON club_session TO club_web;
GRANT SELECT, INSERT (id, member_id, topic, body) ON club_note TO club_web;
GRANT SELECT, INSERT, DELETE, UPDATE (hits) ON club_quota TO club_web;
