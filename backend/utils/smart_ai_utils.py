from pathlib import Path

# SMART_AI_CODE=""" 
# import json
# import time
# from sentence_transformers import SentenceTransformer, util
# from playwright.sync_api import sync_playwright
# from pathlib import Path

# # ====== SMART AI SELF-HEALER CORE ======

# class SmartAILocatorError(Exception):
#     pass

# class SmartAISelfHealing:
#     def __init__(self, metadata):
#         self.metadata = metadata
#         self.model = SentenceTransformer("all-MiniLM-L6-v2")

#     def find_element(self, unique_name, page):
#         element = self._find_by_unique_name(unique_name)
#         if element:
#             print(f"[SmartAI] Found element by unique_name: {unique_name}")
#             return self._try_all_locators(element, page)

#         print(f"[SmartAI] Unique_name '{unique_name}' not found. ML self-healing in progress...")
#         element = self._ml_self_heal(unique_name)
#         if element:
#             print(f"[SmartAI] Healed element found via ML matching: {element.get('unique_name')}")
#             return self._try_all_locators(element, page)

#         raise SmartAILocatorError(f"Element '{unique_name}' not found and cannot self-heal.")

#     def _find_by_unique_name(self, unique_name):
#         for element in self.metadata:
#             if element.get("unique_name") == unique_name:
#                 return element
#         return None

#     def _try_all_locators(self, element, page):
#         try_methods = []

#         # Placeholder
#         if element.get("placeholder"):
#             try_methods.append(lambda: page.get_by_placeholder(element["placeholder"]))

#         # Label text
#         if element.get("label_text"):
#             try_methods.append(lambda: page.get_by_text(element["label_text"]))

#         # Role
#         if element.get("tag_name"):
#             try_methods.append(lambda: page.get_by_role(role=element["tag_name"], name=element.get("label_text", None)))

#         # Test ID
#         data_attrs = element.get("data_attrs", {})
#         for k, v in data_attrs.items():
#             if "test" in k or "qa" in k:
#                 try_methods.append(lambda: page.get_by_test_id(v))

#         # Sample value
#         if element.get("sample_value"):
#             try_methods.append(lambda: page.get_by_display_value(element["sample_value"]))

#         # Class-based
#         if element.get("class_list"):
#             sel = "." + ".".join(element["class_list"])
#             try_methods.append(lambda: page.locator(sel))

#         # Try all locators until one works
#         for method in try_methods:
#             try:
#                 locator = method()
#                 if locator.count():
#                     print(f"[SmartAI] Found using: {method}")
#                     return locator
#             except Exception as e:
#                 continue

#         raise SmartAILocatorError(f"No valid locator method found for '{element.get('unique_name')}'")

#     def _ml_self_heal(self, unique_name):
#         query_embedding = self.model.encode(unique_name, convert_to_tensor=True, show_progress_bar=False)
#         best_score = -1
#         best_element = None
#         for element in self.metadata:
#             attr_str = self._element_to_string(element)
#             attr_embedding = self.model.encode(attr_str, convert_to_tensor=True, show_progress_bar=False)
#             score = util.cos_sim(query_embedding, attr_embedding).item()
#             if score > best_score:
#                 best_score = score
#                 best_element = element

#         print(f"[SmartAI] Best healed match score: {best_score}")
#         return best_element if best_score > 0.3 else None

#     def _element_to_string(self, element):
#         fields = [
#             element.get("unique_name", ""),
#             element.get("label_text", ""),
#             element.get("intent", ""),
#             element.get("ocr_type", ""),
#             element.get("element_type", ""),
#             element.get("tag_name", ""),
#             element.get("placeholder", ""),
#             " ".join(element.get("class_list", [])) if element.get("class_list") else "",
#             json.dumps(element.get("data_attrs", {})),
#             element.get("sample_value", ""),
#         ]
#         return " ".join([str(f) for f in fields if f])

# # ====== PAGE PATCH ======

# def patch_page_with_smartai(page, metadata):
#     ai_healer = SmartAISelfHealing(metadata)
#     def smartAI(unique_name):
#         return ai_healer.find_element(unique_name, page)
#     page.smartAI = smartAI
#     return page

# # ====== SAMPLE METADATA + USAGE ======

# sample_metadata = [
#     {
#         "unique_name": "saucedemo_login_username_username",
#         "label_text": "Username",
#         "intent": "fill_username",
#         "ocr_type": "textbox",
#         "element_type": "input",
#         "tag_name": "input",
#         "placeholder": "Username",
#         "class_list": ["input_error", "form_input"],
#         "data_attrs": {"data-test": "username"},
#         "sample_value": "standard_user"
#     },
#     {
#         "unique_name": "saucedemo_login_password_password",
#         "label_text": "Password",
#         "intent": "fill_password",
#         "ocr_type": "textbox",
#         "element_type": "input",
#         "tag_name": "input",
#         "placeholder": "Password",
#         "class_list": ["input_error", "form_input"],
#         "data_attrs": {"data-test": "password"},
#         "sample_value": "secret_sauce"
#     },
#     {
#         "unique_name": "saucedemo_login_login_login",
#         "label_text": "Login",
#         "intent": "click_login",
#         "ocr_type": "button",
#         "element_type": "button",
#         "tag_name": "button",
#         "class_list": ["btn", "btn_action"],
#         "data_attrs": {"data-test": "login-button"}
#     }
# ]

# if __name__ == "__main__":
#     with sync_playwright() as p:
#         browser = p.chromium.launch(headless=False)
#         page = browser.new_page()
#         page.goto("https://www.saucedemo.com/")

#         # Get the path to THIS FILE's directory
#         script_dir = Path(__file__).parent
#         # Go up one to 'src', then into 'metadata'
#         metadata_path = (script_dir.parent / "metadata" / "after_enrichment.json").resolve()

#         print("Loading:", metadata_path)  # Debug, can remove

#         with open(metadata_path, "r") as f:
#             actual_metadata = json.load(f)
        
#         patch_page_with_smartai(page, actual_metadata)

#         try:
#             page.smartAI("saucedemo_login_username_username").fill("standard_user")
#             print("username filled")
#         except SmartAILocatorError as e:
#             print(f"Username fill failed: {e}")

#         try:
#             page.smartAI("saucedemo_login_password_password").fill("secret_sauce")
#             print("password filled")
#         except SmartAILocatorError as e:
#             print(f"Password fill failed: {e}")

#         try:
#             page.smartAI("saucedemo_login_login_login").click()
#             print("login button clicked")
#         except SmartAILocatorError as e:
#             print(f"Login click failed: {e}")

#         # Wait 5 seconds to observe
#         time.sleep(15)
#         browser.close()

# """

# SMART_AI_CODE = """ 
# # import json
# # import time
# # from sentence_transformers import SentenceTransformer, util
# # from playwright.sync_api import sync_playwright
# # from pathlib import Path

# # # ====== SMART AI SELF-HEALER CORE ======

# # class SmartAILocatorError(Exception):
# #     pass

# # class SmartAISelfHealing:
# #     def __init__(self, metadata):
# #         self.metadata = metadata
# #         self.model = SentenceTransformer("all-MiniLM-L6-v2")

# #     def find_element(self, unique_name, page):
# #         element = self._find_by_unique_name(unique_name)
        
# #         if element:
# #             print(f"[SmartAI] Found element by unique_name: {unique_name}")
# #             return self._try_all_locators(element, page)

# #         print(f"[SmartAI] Unique_name '{unique_name}' not found. ML self-healing in progress...")
# #         element = self._ml_self_heal(unique_name)
# #         if element:
# #             print(f"[SmartAI] Healed element found via ML matching: {element.get('unique_name')}")
# #             return self._try_all_locators(element, page)

# #         raise SmartAILocatorError(f"Element '{unique_name}' not found and cannot self-heal.")

# #     def _find_by_unique_name(self, unique_name):
# #         for element in self.metadata:
# #             if element.get("unique_name") == unique_name:
# #                 return element
# #         return None

# #     def _try_all_locators(self, element, page):
# #         try_methods = []

# #         # Placeholder
# #         if element.get("placeholder"):
# #             try_methods.append(lambda: page.get_by_placeholder(element["placeholder"]))

# #         # Label text
# #         if element.get("label_text"):
# #             try_methods.append(lambda: page.get_by_text(element["label_text"]))

# #         # Role
# #         if element.get("tag_name"):
# #             try_methods.append(lambda: page.get_by_role(role=element["tag_name"], name=element.get("label_text", None)))

# #         # Test ID
# #         data_attrs = element.get("data_attrs", {})
# #         for k, v in data_attrs.items():
# #             if "test" in k or "qa" in k:
# #                 try_methods.append(lambda: page.get_by_test_id(v))

# #         # Sample value
# #         if element.get("sample_value"):
# #             try_methods.append(lambda: page.get_by_display_value(element["sample_value"]))

# #         # Class-based
# #         if element.get("class_list"):
# #             sel = "." + ".".join(element["class_list"])
# #             try_methods.append(lambda: page.locator(sel))

# #         # Try all locators until one works
# #         for method in try_methods:
# #             try:
# #                 locator = method()
# #                 if locator.count():
# #                     print(f"[SmartAI] Found using: {method}")
# #                     return locator
# #             except Exception as e:
# #                 continue

# #         raise SmartAILocatorError(f"No valid locator method found for '{element.get('unique_name')}'")

# #     def _ml_self_heal(self, unique_name):
# #         query_embedding = self.model.encode(unique_name, convert_to_tensor=True, show_progress_bar=False)
# #         best_score = -1
# #         best_element = None
# #         for element in self.metadata:
# #             attr_str = self._element_to_string(element)
# #             attr_embedding = self.model.encode(attr_str, convert_to_tensor=True, show_progress_bar=False)
# #             score = util.cos_sim(query_embedding, attr_embedding).item()
# #             if score > best_score:
# #                 best_score = score
# #                 best_element = element

# #         print(f"[SmartAI] Best healed match score: {best_score}")
# #         return best_element if best_score > 0.3 else None

# #     def _element_to_string(self, element):
# #         fields = [
# #             element.get("unique_name", ""),
# #             element.get("label_text", ""),
# #             element.get("intent", ""),
# #             element.get("ocr_type", ""),
# #             element.get("element_type", ""),
# #             element.get("tag_name", ""),
# #             element.get("placeholder", ""),
# #             " ".join(element.get("class_list", [])) if element.get("class_list") else "",
# #             json.dumps(element.get("data_attrs", {})),
# #             element.get("sample_value", ""),
# #         ]
# #         return " ".join([str(f) for f in fields if f])

# # # ====== PAGE PATCH ======

# # def patch_page_with_smartai(page, metadata):
# #     ai_healer = SmartAISelfHealing(metadata)
# #     def smartAI(unique_name):
# #         return ai_healer.find_element(unique_name, page)
# #     page.smartAI = smartAI
# #     return page

# # # ====== SAMPLE METADATA + USAGE ======

# # if __name__ == "__main__":
# #     with sync_playwright() as p:
# #         browser = p.chromium.launch(headless=False)
# #         page = browser.new_page()
# #         page.goto("https://www.saucedemo.com/")

# #         # Get the path to THIS FILE's directory
# #         script_dir = Path(__file__).parent
# #         # Go up one to 'src', then into 'metadata'
# #         metadata_path = (script_dir.parent / "metadata" / "after_enrichment.json").resolve()

# #         print("Loading:", metadata_path)  # Debug, can remove

# #         with open(metadata_path, "r") as f:
# #             actual_metadata = json.load(f)
        
# #         patch_page_with_smartai(page, actual_metadata)

# #         try:  
# #             assert page.smartAI('saucedemo_login_title_swag_labs_label').is_visible()
# #         except Exception as e:
# #             print('Exception in swag_labs_label', e)
# #         time.sleep(2)

# #         try:
# #             assert page.smartAI('saucedemo_login_username_username_textbox').is_visible()
# #             # page.smartAI("saucedemo_login_username_username").fill("standard_user")
# #             locator = page.smartAI('saucedemo_login_username_username_textbox')
# #             print('got locator')
# #             time.sleep(1)
# #             locator.fill('standard_user')
# #             print("username filled")
# #         except SmartAILocatorError as e:
# #             print(f"Username fill failed: {e}")
# #         time.sleep(2)

# #         try:
# #             # page.smartAI("saucedemo_login_password_password").fill("secret_sauce")
# #             page.smartAI('saucedemo_login_password_password_textbox').fill('secret_sauce')
# #             print("password filled")
# #         except SmartAILocatorError as e:
# #             print(f"Password fill failed: {e}")
# #         time.sleep(2)

# #         try:
# #             # page.smartAI("saucedemo_login_login_login").click()
# #             page.smartAI('saucedemo_login_submit_login_button').click()
# #             print("login button clicked")
# #         except SmartAILocatorError as e:
# #             print(f"Login click failed: {e}")
# #         time.sleep(2)

# #         # Wait 5 seconds to observe
# #         time.sleep(15)
# #         browser.close()



# # ===================================== NEW CODE ====================================================================

# import json
# import time
# from sentence_transformers import SentenceTransformer, util
# from playwright.sync_api import sync_playwright
# from pathlib import Path

# # ====== SMART AI SELF-HEALER CORE ======

# class SmartAILocatorError(Exception):
#     pass

# class SmartAISelfHealing:
#     def __init__(self, metadata):
#         self.metadata = metadata
#         self.model = SentenceTransformer("all-MiniLM-L6-v2")

#     def find_element(self, unique_name, page):
#         element = self._find_by_unique_name(unique_name)

#         if element:
#             locator = self._try_all_locators(element, page)
#             if locator:
#                 print(f"[SmartAI] Element '{unique_name}' found using standard locator methods.")
#                 return locator
#             print(f"[SmartAI] Standard methods failed for '{unique_name}'. ML self-healing in progress...")
#         else:
#             print(f"[SmartAI] Unique_name '{unique_name}' not found. ML self-healing in progress...")

#         element_ml = self._ml_self_heal(unique_name)
#         if element_ml:
#             locator_ml = self._try_all_locators(element_ml, page)
#             if locator_ml:
#                 print(f"[SmartAI] Healed element found via ML matching: '{element_ml.get('unique_name')}'")
#                 return locator_ml

#         raise SmartAILocatorError(f"Element '{unique_name}' not found and cannot self-heal.")

#     def _find_by_unique_name(self, unique_name):
#         for element in self.metadata:
#             if element.get("unique_name") == unique_name:
#                 return element
#         return None

#     def _map_tag_to_role(self, tag):
#         tag_role_map = {
#             'button': 'button',
#             'input': 'textbox',
#             'select': 'combobox',
#             'textarea': 'textbox',
#             'checkbox': 'checkbox'
#         }
#         return tag_role_map.get(tag.lower(), None)

#     def _try_all_locators(self, element, page):
#         try_methods = []

#         if element.get("placeholder"):
#             try_methods.append(lambda: page.get_by_placeholder(element["placeholder"]))

#         if element.get("label_text"):
#             try_methods.append(lambda: page.get_by_label(element["label_text"]))
#             try_methods.append(lambda: page.get_by_text(element["label_text"], exact=True))

#         if element.get("tag_name"):
#             role = self._map_tag_to_role(element["tag_name"])
#             if role:
#                 try_methods.append(lambda: page.get_by_role(role, name=element.get("label_text", None)))

#         data_attrs = element.get("data_attrs", {})
#         for k, v in data_attrs.items():
#             if "test" in k.lower() or "qa" in k.lower():
#                 try_methods.append(lambda: page.get_by_test_id(v))

#         if element.get("sample_value"):
#             try_methods.append(lambda: page.get_by_display_value(element["sample_value"]))

#         if element.get("locator") and element["locator"].get("type") == "css":
#             try_methods.append(lambda: page.locator(element["locator"]["value"]))

#         if element.get("class_list"):
#             sel = "." + ".".join(element["class_list"])
#             try_methods.append(lambda: page.locator(sel))

#         for method in try_methods:
#             try:
#                 locator = method()
#                 if locator.count() > 0:
#                     return locator
#             except Exception:
#                 continue

#         return None

#     def _ml_self_heal(self, unique_name):
#         query_embedding = self.model.encode(unique_name, convert_to_tensor=True, show_progress_bar=False)
#         best_score = -1
#         best_element = None
#         for element in self.metadata:
#             attr_str = self._element_to_string(element)
#             attr_embedding = self.model.encode(attr_str, convert_to_tensor=True, show_progress_bar=False)
#             score = util.cos_sim(query_embedding, attr_embedding).item()
#             if score > best_score:
#                 best_score = score
#                 best_element = element

#         print(f"[SmartAI] Best healed match score: {best_score}")
#         return best_element if best_score > 0.3 else None

#     def _element_to_string(self, element):
#         fields = [
#             element.get("unique_name", ""),
#             element.get("label_text", ""),
#             element.get("intent", ""),
#             element.get("ocr_type", ""),
#             element.get("element_type", ""),
#             element.get("tag_name", ""),
#             element.get("placeholder", ""),
#             " ".join(element.get("class_list", [])) if element.get("class_list") else "",
#             json.dumps(element.get("data_attrs", {})),
#             element.get("sample_value", ""),
#         ]
#         return " ".join([str(f) for f in fields if f])

# # ====== PAGE PATCH ======

# def patch_page_with_smartai(page, metadata):
#     ai_healer = SmartAISelfHealing(metadata)
#     def smartAI(unique_name):
#         return ai_healer.find_element(unique_name, page)
#     page.smartAI = smartAI
#     return page

# # ====== SAMPLE METADATA + USAGE ======

# if __name__ == "__main__":
#     with sync_playwright() as p:
#         browser = p.chromium.launch(headless=False)
#         page = browser.new_page()
#         page.goto("https://www.saucedemo.com/")

#         script_dir = Path(__file__).parent
#         metadata_path = (script_dir.parent / "metadata" / "after_enrichment.json").resolve()

#         with open(metadata_path, "r") as f:
#             actual_metadata = json.load(f)

#         patch_page_with_smartai(page, actual_metadata)

#         try:
#             page.smartAI('saucedemo_login_title_swag_labs_label').wait_for(state='visible', timeout=5000)
#             print("Swag Labs title verified.")
#         except Exception as e:
#             print(f"Title verification error: {e}")

#         try:
#             username_field = page.smartAI('saucedemo_login_username_username_textbox')
#             username_field.wait_for(state='editable', timeout=5000)
#             username_field.fill("standard_user")
#             print("Username filled successfully.")
#         except Exception as e:
#             print(f"Username fill error: {e}")

#         try:
#             password_field = page.smartAI('saucedemo_login_password_password_textbox')
#             password_field.wait_for(state='editable', timeout=5000)
#             password_field.fill("secret_sauce")
#             print("Password filled successfully.")
#         except Exception as e:
#             print(f"Password fill error: {e}")

#         try:
#             login_btn = page.smartAI('saucedemo_login_submit_login_button')
#             login_btn.wait_for(state='visible', timeout=5000)
#             login_btn.click()
#             print("Login button clicked.")
#         except Exception as e:
#             print(f"Login click error: {e}")

#         time.sleep(5)
#         browser.close()










# # ===================================== NEW CODE ====================================================================

# # import json
# # import time
# # from sentence_transformers import SentenceTransformer, util
# # from playwright.sync_api import sync_playwright
# # from pathlib import Path

# # class SmartAILocatorError(Exception):
# #     pass

# # class SmartAISelfHealing:
# #     def __init__(self, metadata):
# #         self.metadata = metadata
# #         self.model = SentenceTransformer("all-MiniLM-L6-v2")

# #     def find_element(self, unique_name, page):
# #         element = self._find_by_unique_name(unique_name)
# #         if not element:
# #             raise SmartAILocatorError(f"Element metadata for '{unique_name}' not found.")

# #         locator = self._try_all_locators(element, page)
# #         if locator:
# #             print(f"[SmartAI] Element '{unique_name}' found using standard locator methods.")
# #             return locator

# #         # Fallback to ML self-healing if playwright methods fail
# #         print(f"[SmartAI] Standard methods failed for '{unique_name}'. ML self-healing in progress...")
# #         element_ml = self._ml_self_heal(unique_name)

# #         if element_ml:
# #             locator_ml = self._try_all_locators(element_ml, page)
# #             if locator_ml:
# #                 print(f"[SmartAI] Healed element found via ML matching: '{element_ml.get('unique_name')}'")
# #                 return locator_ml

# #         raise SmartAILocatorError(f"Element '{unique_name}' not found and cannot self-heal.")

# #     def _find_by_unique_name(self, unique_name):
# #         for element in self.metadata:
# #             if element.get("unique_name") == unique_name:
# #                 return element
# #         return None

# #     def _try_all_locators(self, element, page):
# #         try_methods = []

# #         # First priority: placeholder
# #         if element.get("placeholder"):
# #             try_methods.append(lambda: page.get_by_placeholder(element["placeholder"]))

# #         # Second priority: Label (explicit)
# #         if element.get("label_text"):
# #             try_methods.append(lambda: page.get_by_label(element["label_text"]))
# #             try_methods.append(lambda: page.get_by_text(element["label_text"], exact=True))

# #         # Role-based locator with valid role mapping
# #         role = self._tag_to_role(element.get("tag_name"))
# #         if role:
# #             try_methods.append(lambda: page.get_by_role(role, name=element.get("label_text", None)))

# #         # Test ID locator
# #         for k, v in element.get("data_attrs", {}).items():
# #             if "test" in k.lower() or "qa" in k.lower():
# #                 try_methods.append(lambda: page.get_by_test_id(v))

# #         # Display value
# #         if element.get("sample_value"):
# #             try_methods.append(lambda: page.get_by_display_value(element["sample_value"]))

# #         # CSS selector from metadata
# #         if element.get("locator") and element["locator"]["type"] == "css":
# #             try_methods.append(lambda: page.locator(element["locator"]["value"]))

# #         # Class-based selector
# #         if element.get("class_list"):
# #             css_sel = "." + ".".join(element["class_list"])
# #             try_methods.append(lambda: page.locator(css_sel))

# #         # Execute and validate locator explicitly for editability
# #         for method in try_methods:
# #             try:
# #                 locator = method()
# #                 if locator.count() and locator.first.is_editable():
# #                     print(f"[SmartAI] Editable locator found: {method}")
# #                     return locator.first
# #                 elif locator.count() and locator.first.is_visible():
# #                     print(f"[SmartAI] Visible locator found (non-editable): {method}")
# #                     return locator.first
# #             except Exception:
# #                 continue

# #         return None

# #     def _tag_to_role(self, tag_name):
# #         tag_role_map = {
# #             'button': 'button',
# #             'input': 'textbox',
# #             'select': 'combobox',
# #             'textarea': 'textbox',
# #             'checkbox': 'checkbox'
# #             # Add more mappings as necessary
# #         }
# #         return tag_role_map.get(tag_name.lower(), None)

# #     def _ml_self_heal(self, unique_name):
# #         query_embedding = self.model.encode(unique_name, convert_to_tensor=True, show_progress_bar=False)
# #         best_score = -1
# #         best_element = None

# #         for element in self.metadata:
# #             attr_str = self._element_to_string(element)
# #             attr_embedding = self.model.encode(attr_str, convert_to_tensor=True, show_progress_bar=False)
# #             score = util.cos_sim(query_embedding, attr_embedding).item()
# #             if score > best_score:
# #                 best_score = score
# #                 best_element = element

# #         print(f"[SmartAI] Best healed match score: {best_score}")
# #         return best_element if best_score > 0.3 else None

# #     def _element_to_string(self, element):
# #         attrs = [
# #             element.get("label_text", ""),
# #             element.get("placeholder", ""),
# #             element.get("tag_name", ""),
# #             " ".join(element.get("class_list", [])),
# #             element.get("locator", {}).get("value", ""),
# #             element.get("sample_value", "")
# #         ]
# #         return " ".join(attrs)




# # def patch_page_with_smartai(page, metadata):
# #     ai_healer = SmartAISelfHealing(metadata)
# #     page.smartAI = lambda unique_name: ai_healer.find_element(unique_name, page)
# #     return page

# # # === SAMPLE USAGE WITH REAL METADATA ===

# # if __name__ == "__main__":
# #     with sync_playwright() as p:
# #         browser = p.chromium.launch(headless=False)
# #         page = browser.new_page()
# #         page.goto("https://www.saucedemo.com/")

# #         script_dir = Path(__file__).parent
# #         metadata_path = (script_dir.parent / "metadata" / "after_enrichment.json").resolve()
# #         print(f"Loading metadata from: {metadata_path}")

# #         with open(metadata_path, "r") as f:
# #             actual_metadata = json.load(f)

# #         patch_page_with_smartai(page, actual_metadata)

# #         try:
# #             page.smartAI('saucedemo_login_title_swag_labs_label').wait_for(state='visible', timeout=5000)
# #             print("Swag Labs title verified.")
# #         except Exception as e:
# #             print(f"Title verification error: {e}")

# #         try:
# #             # username_field = page.smartAI('saucedemo_login_username_username_textbox')

# #             username_field = page.smartAI('saucedemo_login_username_username_textbox')
# #             if username_field and username_field.is_editable():
# #                 username_field.fill("standard_user")
# #             else:
# #                 raise SmartAILocatorError("Found element isn't editable.")

# #             # username_field.wait_for(state='editable', timeout=5000)
# #             # username_field.fill("standard_user")
# #             print("Username filled successfully.")
# #         except Exception as e:
# #             print(f"Username fill error: {e}")

# #         try:
# #             password_field = page.smartAI('saucedemo_login_password_password_textbox')
# #             password_field.wait_for(state='editable', timeout=5000)
# #             password_field.fill("secret_sauce")
# #             print("Password filled successfully.")
# #         except Exception as e:
# #             print(f"Password fill error: {e}")

# #         try:
# #             login_btn = page.smartAI('saucedemo_login_submit_login_button')
# #             login_btn.wait_for(state='visible', timeout=5000)
# #             login_btn.click()
# #             print("Login button clicked.")
# #         except Exception as e:
# #             print(f"Login click error: {e}")

# #         time.sleep(5)
# #         browser.close()




# """

SMART_AI_CODE = """
import json
import time
from sentence_transformers import SentenceTransformer, util
from playwright.sync_api import sync_playwright
from pathlib import Path

# ====== SMART AI SELF-HEALER CORE ======

class SmartAILocatorError(Exception):
    pass

class SmartAISelfHealing:
    def __init__(self, metadata):
        self.metadata = metadata
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def find_element(self, unique_name, page):
        element = self._find_by_unique_name(unique_name)

        if element:
            locator = self._try_all_locators(element, page)
            if locator:
                print(f"[SmartAI] Element '{unique_name}' found using standard locator methods.")
                return locator
            print(f"[SmartAI] Standard methods failed for '{unique_name}'. ML self-healing in progress...")
        else:
            print(f"[SmartAI] Unique_name '{unique_name}' not found. ML self-healing in progress...")

        element_ml = self._ml_self_heal(unique_name)
        if element_ml:
            locator_ml = self._try_all_locators(element_ml, page)
            if locator_ml:
                print(f"[SmartAI] Healed element found via ML matching: '{element_ml.get('unique_name')}'")
                return locator_ml

        raise SmartAILocatorError(f"Element '{unique_name}' not found and cannot self-heal.")

    def _find_by_unique_name(self, unique_name):
        for element in self.metadata:
            if element.get("unique_name") == unique_name:
                return element
        return None

    def _map_tag_to_role(self, tag):
        tag_role_map = {
            'button': 'button',
            'input': 'textbox',
            'select': 'combobox',
            'textarea': 'textbox',
            'checkbox': 'checkbox'
        }
        return tag_role_map.get(tag.lower(), None)

    def _try_all_locators(self, element, page):
        try_methods = []

        if element.get("placeholder"):
            try_methods.append(lambda: page.get_by_placeholder(element["placeholder"]))

        if element.get("label_text"):
            try_methods.append(lambda: page.get_by_label(element["label_text"]))
            try_methods.append(lambda: page.get_by_text(element["label_text"], exact=True))

        if element.get("tag_name"):
            role = self._map_tag_to_role(element["tag_name"])
            if role:
                try_methods.append(lambda: page.get_by_role(role, name=element.get("label_text", None)))

        data_attrs = element.get("data_attrs", {})
        for k, v in data_attrs.items():
            if "test" in k.lower() or "qa" in k.lower():
                try_methods.append(lambda: page.get_by_test_id(v))

        if element.get("sample_value"):
            try_methods.append(lambda: page.get_by_display_value(element["sample_value"]))

        if element.get("locator") and element["locator"].get("type") == "css":
            try_methods.append(lambda: page.locator(element["locator"]["value"]))

        if element.get("class_list"):
            sel = "." + ".".join(element["class_list"])
            try_methods.append(lambda: page.locator(sel))

        for method in try_methods:
            try:
                locator = method()
                if locator.count() > 0:
                    return locator
            except Exception:
                continue

        return None

    def _ml_self_heal(self, unique_name):
        query_embedding = self.model.encode(unique_name, convert_to_tensor=True, show_progress_bar=False)
        best_score = -1
        best_element = None
        for element in self.metadata:
            attr_str = self._element_to_string(element)
            attr_embedding = self.model.encode(attr_str, convert_to_tensor=True, show_progress_bar=False)
            score = util.cos_sim(query_embedding, attr_embedding).item()
            if score > best_score:
                best_score = score
                best_element = element

        print(f"[SmartAI] Best healed match score: {best_score}")
        return best_element if best_score > 0.3 else None

    def _element_to_string(self, element):
        fields = [
            element.get("unique_name", ""),
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
    def smartAI(unique_name):
        return ai_healer.find_element(unique_name, page)
    page.smartAI = smartAI
    return page

# ====== SAMPLE METADATA + USAGE ======

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("https://www.saucedemo.com/")

        script_dir = Path(__file__).parent
        metadata_path = (script_dir.parent / "metadata" / "after_enrichment.json").resolve()

        with open(metadata_path, "r") as f:
            actual_metadata = json.load(f)

        patch_page_with_smartai(page, actual_metadata)

        try:
            page.smartAI('saucedemo_login_title_swag_labs_label').wait_for(state='visible', timeout=5000)
            print("Swag Labs title verified.")
        except Exception as e:
            print(f"Title verification error: {e}")

        try:
            username_field = page.smartAI('saucedemo_login_username_username_textbox')
            username_field.wait_for(state='editable', timeout=5000)
            username_field.fill("standard_user")
            print("Username filled successfully.")
        except Exception as e:
            print(f"Username fill error: {e}")

        try:
            password_field = page.smartAI('saucedemo_login_password_password_textbox')
            password_field.wait_for(state='editable', timeout=5000)
            password_field.fill("secret_sauce")
            print("Password filled successfully.")
        except Exception as e:
            print(f"Password fill error: {e}")

        try:
            login_btn = page.smartAI('saucedemo_login_submit_login_button')
            login_btn.wait_for(state='visible', timeout=5000)
            login_btn.click()
            print("Login button clicked.")
        except Exception as e:
            print(f"Login click error: {e}")

        time.sleep(5)
        browser.close()

"""

def ensure_smart_ai_module():
    lib_path = Path("generated_runs/src/lib")
    lib_path.mkdir(parents=True, exist_ok=True)
    # --- ADD THIS LINE! ---
    (lib_path / "__init__.py").touch()
    # ----------------------
    smart_ai_file = lib_path / "smart_ai.py"
    if not smart_ai_file.exists():
        smart_ai_file.write_text(SMART_AI_CODE, encoding="utf-8")