def filter_dom_matched_elements(page_name: str):
    return [r for r in collection.get(where={"page_name": page_name}).get("metadatas", []) if r.get("dom_matched")]

def sanitize_identifier(label: str) -> str:
    return re.sub(r'\W|^(?=\d)', '_', label.lower()) if label else "element"

def generate_page_object_class(page_name: str, locators: list[dict]) -> tuple[str, dict]:
    class_name = get_class_name(page_name)
    base_url = os.getenv("BASE_URL", "https://www.saucedemo.com/")
    lines = [
        "from playwright.sync_api import Page, expect",
        f"class {class_name}:",
        "    def __init__(self, page: Page):",
        "        self.page = page",
        "",
        "    def navigate_to_site(self):",
        f"        print(\"Navigating to site...\")",
        f"        self.page.goto('{base_url}')",
        ""
    ]
    method_names = {}

    for loc in locators:
        raw_label = (
            loc.get("label_text")
            or loc.get("text")
            or loc.get("placeholder")
            or loc.get("aria_label")
            or loc.get("name")
            or loc.get("id")
        )
        if not raw_label:
            continue

        label = generalize_label(raw_label)
        tag = loc.get("tag_name", "").lower()
        selector = loc.get("css") or f"text={label}"
        safe = sanitize_identifier(label)

        lines += [
            f"    def click_{safe}(self):",
            f"        print(\"Clicking {label}\")",
            f"        self.page.locator(\"{selector}\").click()",
            ""
        ]
        method_names.setdefault(label, []).append(f"click_{safe}()")

        if tag in ["input", "textarea", "select"]:
            lines += [
                f"    def fill_{safe}(self, value):",
                f"        print(\"Filling {label} with value\")",
                f"        self.page.locator(\"{selector}\").fill(value)",
                ""
            ]
            method_names[label].append(f"fill_{safe}(value)")

        lines += [
            f"    def expect_{safe}_visible(self):",
            f"        print(\"Expecting {label} to be visible\")",
            f"        expect(self.page.locator(\"{selector}\")).to_be_visible()",
            ""
        ]
        method_names[label].append(f"expect_{safe}_visible()")

    return "\n".join(lines), method_names

def generate_test_code_from_gpt(page_names: list[str], method_info: dict, source_url: str) -> str:
    prompt = f"""
You are a senior QA automation engineer.
Generate a complete Python Playwright test function called `test_end_to_end()`.

Instructions:
- Only write one test function `test_end_to_end()`
- Assume the following classes are already defined and imported:
{', '.join(get_class_name(page) for page in page_names)}
- Use:
with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
- Instantiate page objects like: `page_obj = ClassName(page)`
- Use only the available methods:
"""
    for page in page_names:
        prompt += f"\n# {get_class_name(page)}:\n"
        for method in method_info.get(page, []):
            prompt += f"- {method}\n"

    prompt += f"""
- Print "[PASS]" if successful, "[CRASH]" if any exception occurs
- End the test with `browser.close()`
- Do NOT include import statements, markdown, or comments
- Do NOT define any page classes; assume they are already imported

Target URL: {source_url}
Return ONLY executable Python code for test_end_to_end() with `if __name__ == "__main__"` block.
"""

    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return result.choices[0].message.content.strip()
