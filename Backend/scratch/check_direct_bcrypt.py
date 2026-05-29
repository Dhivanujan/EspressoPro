import bcrypt

def test_direct_bcrypt():
    admin_hash = "$2b$12$du96h0FwQ2FhGdVwcndfwOJKzspVV2nnTriMSUsUJONAYJZLmPLey"
    cashier_hash = "$2b$12$0V4vfpZluL3QWhEp3Bki5.ZmbfOj3L7whGwU7bPjtjPJQJ8ablOia"
    
    print("Admin verify:", bcrypt.checkpw("admin123".encode("utf-8"), admin_hash.encode("utf-8")))
    print("Cashier verify:", bcrypt.checkpw("cashier123".encode("utf-8"), cashier_hash.encode("utf-8")))

if __name__ == "__main__":
    test_direct_bcrypt()
