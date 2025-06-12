from pathlib import Path

SMART_AI_CODE=""" 
import json
import time
from sentence_transformers import SentenceTransformer, util
from playwright.sync_api import sync_playwright

# ====== SMART AI SELF-HEALER CORE ======

class SmartAILocatorError(Exception):
    pass

class SmartAISelfHealing:
    def __init__(self, metadata):
        self.metadata = metadata
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def find_element(self, unique_id, page):
        element = self._find_by_unique_id(unique_id)
        if element:
            print(f"[SmartAI] Found element by uniqueID: {unique_id}")
            return self._try_all_locators(element, page)

        print(f"[SmartAI] UniqueID '{unique_id}' not found. ML self-healing in progress...")
        element = self._ml_self_heal(unique_id)
        if element:
            print(f"[SmartAI] Healed element found via ML matching: {element.get('uniqueID')}")
            return self._try_all_locators(element, page)

        raise SmartAILocatorError(f"Element '{unique_id}' not found and cannot self-heal.")

    def _find_by_unique_id(self, unique_id):
        for element in self.metadata:
            if element.get("uniqueID") == unique_id:
                return element
        return None

    def _try_all_locators(self, element, page):
        try_methods = []

        # Placeholder
        if element.get("placeholder"):
            try_methods.append(lambda: page.get_by_placeholder(element["placeholder"]))

        # Label text
        if element.get("label_text"):
            try_methods.append(lambda: page.get_by_text(element["label_text"]))

        # Role
        if element.get("tag_name"):
            try_methods.append(lambda: page.get_by_role(role=element["tag_name"], name=element.get("label_text", None)))

        # Test ID
        data_attrs = element.get("data_attrs", {})
        for k, v in data_attrs.items():
            if "test" in k or "qa" in k:
                try_methods.append(lambda: page.get_by_test_id(v))

        # Sample value
        if element.get("sample_value"):
            try_methods.append(lambda: page.get_by_display_value(element["sample_value"]))

        # Class-based
        if element.get("class_list"):
            sel = "." + ".".join(element["class_list"])
            try_methods.append(lambda: page.locator(sel))

        # Try all locators until one works
        for method in try_methods:
            try:
                locator = method()
                if locator.count():
                    print(f"[SmartAI] Found using: {method}")
                    return locator
            except Exception as e:
                continue

        raise SmartAILocatorError(f"No valid locator method found for '{element.get('uniqueID')}'")

    def _ml_self_heal(self, unique_id):
        query_embedding = self.model.encode(unique_id, convert_to_tensor=True)
        best_score = -1
        best_element = None
        for element in self.metadata:
            attr_str = self._element_to_string(element)
            attr_embedding = self.model.encode(attr_str, convert_to_tensor=True)
            score = util.cos_sim(query_embedding, attr_embedding).item()
            if score > best_score:
                best_score = score
                best_element = element

        print(f"[SmartAI] Best healed match score: {best_score}")
        return best_element if best_score > 0.6 else None

    def _element_to_string(self, element):
        fields = [
            element.get("uniqueID", ""),
            element.get("label_text", ""),
            element.get("intent", ""),
            element.get("ocr_type", ""),
            element.get("element_type", ""),
            element.get("tag_name", ""),
            element.get("placeholder", ""),
            " ".join(element.get("class_list", [])) if element.get("class_list") else "",
            json.dumps(element.get("data_attrs", {})),
            element.get("sample_value", ""),
        ]
        return " ".join([str(f) for f in fields if f])

# ====== PAGE PATCH ======

def patch_page_with_smartai(page, metadata):
    ai_healer = SmartAISelfHealing(metadata)
    def smartAI(unique_id):
        return ai_healer.find_element(unique_id, page)
    page.smartAI = smartAI
    return page

# ====== SAMPLE METADATA + USAGE ======

sample_metadata = [
    {
        "uniqueID": "a123",
        "label_text": "Username",
        "intent": "fill_username",
        "ocr_type": "textbox",
        "element_type": "input",
        "tag_name": "input",
        "placeholder": "Username",
        "class_list": ["input_error", "form_input"],
        "data_attrs": {"data-test": "username"},
        "sample_value": "standard_user"
    },
    {
        "uniqueID": "b1234",
        "label_text": "Password",
        "intent": "fill_password",
        "ocr_type": "textbox",
        "element_type": "input",
        "tag_name": "input",
        "placeholder": "Password",
        "class_list": ["input_error", "form_input"],
        "data_attrs": {"data-test": "password"},
        "sample_value": "secret_sauce"
    },
    {
        "uniqueID": "saucedemo_login_login_login",
        "label_text": "Login",
        "intent": "click_login",
        "ocr_type": "button",
        "element_type": "button",
        "tag_name": "button",
        "class_list": ["btn", "btn_action"],
        "data_attrs": {"data-test": "login-button"}
    }
]

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("https://www.saucedemo.com/")
        with open("metadata.json", "w") as f:
            json.dump(sample_metadata, f, indent=4)
        
        patch_page_with_smartai(page, sample_metadata)

        try:
            page.smartAI("saucedemo_login_username_username").fill("standard_user")
        except SmartAILocatorError as e:
            print(f"Username fill failed: {e}")

        try:
            page.smartAI("saucedemo_login_password_password").fill("secret_sauce")
        except SmartAILocatorError as e:
            print(f"Password fill failed: {e}")

        try:
            page.smartAI("saucedemo_login_login_login").click()
        except SmartAILocatorError as e:
            print(f"Login click failed: {e}")

        # Wait 5 seconds to observe
        time.sleep(5)
        browser.close()
"""

def ensure_smart_ai_module():
    lib_path = Path("generated_runs/lib")
    lib_path.mkdir(parents=True, exist_ok=True)
    smart_ai_file = lib_path / "smart_ai.py"
    if not smart_ai_file.exists():
        smart_ai_file.write_text(SMART_AI_CODE, encoding="utf-8")