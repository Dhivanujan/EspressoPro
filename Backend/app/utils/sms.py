import logging
import re

logger = logging.getLogger("app.utils.sms")

def clean_srilankan_phone(phone: str) -> str:
    """
    Cleans and normalizes Sri Lankan phone numbers to international standard format.
    Accepts:
        0771234567 -> +94771234567
        771234567 -> +94771234567
        +94771234567 -> +94771234567
        94771234567 -> +94771234567
    """
    # Remove all non-digits, keep '+' if present
    cleaned = re.sub(r"[^\d+]", "", phone)
    
    # Check if it's already in international standard
    if cleaned.startswith("+947"):
        if len(cleaned) == 12:
            return cleaned
        
    if cleaned.startswith("947") and len(cleaned) == 11:
        return f"+{cleaned}"
        
    # Check for local format
    if cleaned.startswith("07") and len(cleaned) == 10:
        return f"+94{cleaned[1:]}"
        
    if (cleaned.startswith("71") or cleaned.startswith("72") or cleaned.startswith("75") or 
        cleaned.startswith("76") or cleaned.startswith("77") or cleaned.startswith("78") or cleaned.startswith("70")) and len(cleaned) == 9:
        return f"+94{cleaned}"
        
    return cleaned

def is_valid_srilankan_mobile(phone: str) -> bool:
    """
    Validates if a phone number matches Sri Lankan mobile number rules.
    Standardized form must be: +947[0125678]XXXXXXXX (12 characters total).
    """
    normalized = clean_srilankan_phone(phone)
    # Match +94 followed by 7, then [0,1,2,5,6,7,8], then 7 digits
    pattern = r"^\+947[0125678]\d{7}$"
    return bool(re.match(pattern, normalized))

def send_sms_notification(phone_number: str, message: str) -> bool:
    """
    Simulates sending an SMS to a Sri Lankan number.
    Logs standard gateway notification message.
    """
    normalized_phone = clean_srilankan_phone(phone_number)
    print(f"\n[SMS GATEWAY (Sri Lanka)] Sending SMS to {normalized_phone}...")
    print(f"[SMS BODY] {message}\n")
    logger.info(f"Simulated SMS sent to {normalized_phone}: {message}")
    return True
