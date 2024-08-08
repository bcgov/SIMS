CREATE TRIGGER users_history_trigger
AFTER INSERT OR UPDATE ON sims.users FOR EACH ROW EXECUTE PROCEDURE sims.create_history_entry();