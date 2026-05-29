from app.services.auth import auth_service

def test_verify():
    admin_hash = "$2b$12$du96h0FwQ2FhGdVwcndfwOJKzspVV2nnTriMSUsUJONAYJZLmPLey"
    cashier_hash = "$2b$12$0V4vfpZluL3QWhEp3Bki5.ZmbfOj3L7whGwU7bPjtjPJQJ8ablOia"
    
    print("Verify admin_hash directly:", auth_service.verify_password("admin123", admin_hash))
    print("Verify cashier_hash directly:", auth_service.verify_password("cashier123", cashier_hash))
    
    new_hash = auth_service.get_password_hash("admin123")
    print("New hash generated:", new_hash)
    print("Verify new hash:", auth_service.verify_password("admin123", new_hash))
    print("Needs update for old hash:", auth_service.needs_password_update(admin_hash))
    print("Needs update for new hash:", auth_service.needs_password_update(new_hash))

if __name__ == "__main__":
    test_verify()
