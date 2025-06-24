# utils/prompt_utils.py
from typing import List

# def build_prompt(
#     story_block: str,
#     method_map: dict,
#     page_names: list[str],
#     site_url: str,
#     dynamic_steps: list[str]
# ) -> str:
#     page_method_section = "\n".join(
#         f"# {p}:\n" + "\n".join(f"- def {m}" for m in method_map.get(p, [])) for p in page_names
#     )
#     dynamic_steps_joined = "\n".join(dynamic_steps)

#     return (
#         f"You are a senior QA automation engineer tasked to write Playwright Python tests for the following user stories:\n"
#         f"{story_block}\n"
#         f"\n"
#         f"Rules:\n"
#         f"- For each user story, generate one **positive**, one **negative**, and one **edge case** test function. "
#         f"These must cover:\n"
#         f"  * Positive: The standard expected flow.\n"
#         f"  * Negative: A flow with invalid or missing data, expecting failure or error.\n"
#         f"  * Edge case: A boundary or unusual condition (e.g. blank, very long, special characters).\n"
#         f"- Name test functions as test_positive_<feature>, test_negative_<feature>, and test_edge_<feature>.\n"
#         f"- The tests must cover the entire end-to-end scenario for the story.\n"
#         f"- Use ONLY the functions imported from the Page Object Model (POM) files (see below). **Do NOT use any classes or class-based page objects.**\n"
#         f"- Never import or use anything from 'page_objects' or use lines like 'LoginPage(page)'.\n"
#         f"- Each test function must use the 'page' object and call the imported functions, e.g. 'fill_username(page, \"value\")'.\n"
#         f"- Do NOT define or generate any new helper functions/methods—use only those already defined.\n"
#         f"- **Do NOT generate any import statements.** (Imports will be handled automatically outside the code block.)\n"
#         f"- Do NOT use markdown, comments, or explanations—output ONLY valid Python code, starting directly with the test function(s).\n"
#         f"\n"
#         f"Site URL: {site_url}\n\n"
#         f"Page Object Methods:\n{page_method_section}\n\n"
#         f"Additional Hints:\n{dynamic_steps_joined}\n\n"
#         f"Generate the code for all three cases below."
#     )


# =========================================== MY Code ========================================
# utils/prompt_utils.py
from typing import List

# def build_prompt(
#     story_block: str,
#     method_map: dict,
#     page_names: list[str],
#     site_url: str,
#     dynamic_steps: list[str]
# ) -> str:
#     page_method_section = "\n".join(
#         f"# {p}:\n" + "\n".join(f"- def {m}" for m in method_map.get(p, [])) for p in page_names
#     )
#     dynamic_steps_joined = "\n".join(dynamic_steps)

#     return (
#         f"You are a senior QA automation engineer tasked to write Playwright Python tests for the following user stories:\n"
#         f"{story_block}\n"
#         f"\n"
#         f"Rules:\n"
#         f"- For each user story, generate one **positive**, one **negative**, and one **edge case** test function. "
#         f"These must cover:\n"
#         f"  * Positive: The standard expected flow.\n"
#         f"  * Negative: A flow with invalid or missing data, expecting failure or error.\n"
#         f"  * Edge case: A boundary or unusual condition (e.g. blank, very long, special characters).\n"
#         f"- Name test functions as test_positive_<feature>, test_negative_<feature>, and test_edge_<feature>.\n"
#         f"- The tests must cover the entire end-to-end scenario for the story.\n"
#         f"- Use ONLY the functions imported from the Page Object Model (POM) files (see below). **Do NOT use any classes or class-based page objects.**\n"
#         f"- Never import or use anything from 'page_objects' or use lines like 'LoginPage(page)'.\n"
#         f"- Each test function must use the 'page' object and call the imported functions, e.g. 'fill_username(page, \"value\")'.\n"
#         f"- Do NOT define or generate any new helper functions/methods—use only those already defined.\n"
#         f"- **Do NOT generate any import statements.** (Imports will be handled automatically outside the code block.)\n"
#         f"- Do NOT use markdown, comments, or explanations—output ONLY valid Python code, starting directly with the test function(s).\n"
#         f"\n"
#         f"Site URL: {site_url}\n\n"
#         f"Page Object Methods:\n{page_method_section}\n\n"
#         f"Additional Hints:\n{dynamic_steps_joined}\n\n"
#         f"Generate the code for all three cases below."
#     )


def build_prompt(
    story_block: str,
    method_map: dict,
    page_names: list[str],
    site_url: str,
    dynamic_steps: list[str]
) -> str:
    page_method_section = "\n".join(
        f"# {p}:\n" + "\n".join(f"- def {m}" for m in method_map.get(p, [])) for p in page_names
    )
    dynamic_steps_joined = "\n".join(dynamic_steps)

    return (
        f"You are a senior QA automation engineer tasked to write Playwright Python tests for the following user stories:\n"
        f"{story_block}\n"
        f"\n"
        f"⚠️ IMPORTANT CONSTRAINTS:\n"
        f"- ONLY use functions that are explicitly listed in the 'Page Object Methods' section below.\n"
        f"- NEVER invent, guess, or generate any method names that are not in the list.\n"
        f"- If a certain step is not supported by the listed methods, SKIP that step.\n"
        f"- Do NOT invent method names (e.g., `verify_order_success`) that are not in the list below.\n"
        f"- Go to the site URL first. \n"
        f"\n"
        f"Rules:\n"
        f"- For each user story, generate one **positive**, one **negative**, and one **edge case** test function. "
        f"These must cover:\n"
        f"  * Positive: The standard expected flow.\n"
        f"  * Negative: A flow with invalid or missing data, expecting failure or error.\n"
        f"  * Edge case: A boundary or unusual condition (e.g. blank, very long, special characters).\n"
        f"- Name test functions as test_positive_<feature>, test_negative_<feature>, and test_edge_<feature>.\n"
        f"- The tests must cover the entire end-to-end scenario for the story.\n"
        f"- Use ONLY the functions imported from the Page Object Model (POM) files (see below). **Do NOT use any classes or class-based page objects.**\n"
        f"- Never import or use anything from 'page_objects' or use lines like 'LoginPage(page)'.\n"
        f"- Each test function must use the 'page' object and call the imported functions, e.g. 'fill_username(page, \"value\")'.\n"
        f"- Do NOT define or generate any new helper functions/methods—use only those already defined.\n"
        f"- **Do NOT generate any import statements.** (Imports will be handled automatically outside the code block.)\n"
        f"- Do NOT use markdown, comments, or explanations—output ONLY valid Python code, starting directly with the test function(s).\n"
        f"\n"
        f"Site URL: {site_url}\n\n"
        f"Page Object Methods:\n{page_method_section}\n\n"
        f"Additional Hints:\n{dynamic_steps_joined}\n\n"
        f"Generate the code for all three cases below."
    )

# def build_prompt(
#     story_block: str,
#     method_map: dict,
#     page_names: list[str],
#     site_url: str,
#     dynamic_steps: list[str]
# ) -> str:
#     page_method_section = "\n".join(
#         f"# {p}:\n" + "\n".join(f"- def {m}" for m in method_map.get(p, [])) for p in page_names
#     )
#     dynamic_steps_joined = "\n".join(dynamic_steps)

#     return (
#         f"You are a senior QA automation engineer tasked to write Playwright Python tests for the following user stories:\n"
#         f"{story_block}\n"
#         f"\n"
#         f"⚠️ MANDATORY CONSTRAINTS:\n"
#         f"- Use ONLY the functions listed in the 'Page Object Methods' section below.\n"
#         f"- NEVER invent, guess, or create method names not explicitly listed.\n"
#         f"- If a step has no matching method, include a comment like `# Skipped step due to missing method: <step description>`.\n"
#         f"- DO NOT use any classes or class-based page objects. Only use functions with `(page, ...)` signature.\n"
#         f"\n"
#         f"📌 TEST GENERATION REQUIREMENT:\n"
#         f"- For each individual PAGE listed below, generate three test functions:\n"
#         f"  * Positive: Typical correct input scenario.\n"
#         f"  * Negative: Invalid or missing data.\n"
#         f"  * Edge: Boundary or extreme input (e.g. long strings, special characters).\n"
#         f"- Do NOT merge steps across pages. Each test should be scoped to its corresponding page.\n"
#         f"- This ensures we have **3 test functions per page** regardless of story length.\n"
#         f"- If any page is not relevant to the user story, still attempt to generate logical edge/negative tests for that page's methods.\n"
#         f"\n"
#         f"- Name test functions as: `test_positive_<page_name>_flow`, `test_negative_<page_name>_flow`, `test_edge_<page_name>_flow`.\n"
#         f"- Call all functions using the `page` object (e.g., `fill_username(page, \"value\")`).\n"
#         f"- DO NOT generate any helper methods, import statements, markdown, or extra text.\n"
#         f"\n"
#         f"Site URL: {site_url}\n\n"
#         f"📄 Page Object Methods:\n{page_method_section}\n\n"
#         f"💡 Additional Hints:\n{dynamic_steps_joined}\n\n"
#         f"Generate the code for all three test cases for each page below."
#     )

# def build_prompt(
#     story_block: str,
#     method_map: dict,
#     page_names: list[str],
#     site_url: str,
#     dynamic_steps: list[str]
# ) -> str:
#     page_method_section = "\n".join(
#         f"# {p}:\n" + "\n".join(f"- def {m}" for m in method_map.get(p, [])) for p in page_names
#     )
#     dynamic_steps_joined = "\n".join(dynamic_steps)

#     return (
#         f"You are a senior QA automation engineer tasked to write Playwright Python tests for the following user story:\n"
#         f"{story_block}\n"
#         f"\n"
#         f"⚠️ MANDATORY CONSTRAINTS:\n"
#         f"- Use ONLY functions listed in the 'Page Object Methods' section.\n"
#         f"- NEVER invent, guess, or create method names not explicitly listed.\n"
#         f"- If a step has no matching method, add comment `# Skipped step due to missing method: <step description>`.\n"
#         f"- DO NOT use classes; ONLY use functions with `(page, ...)` signatures.\n"
#         f"\n"
#         f"📌 TEST GENERATION REQUIREMENTS (VERY IMPORTANT):\n"
#         f"For each individual PAGE listed, generate three test functions (positive, negative, edge).\n"
#         f"Each test MUST start from the beginning (open URL '{site_url}') and INCLUDE ALL NECESSARY PREREQUISITE STEPS (like login, navigation, adding items to cart, etc.) to logically reach the page under test.\n"
#         f"Prerequisite steps for each page are as follows:\n"
#         f"  - login: Navigate to URL first.\n"
#         f"  - inventory: Navigate to URL, then login.\n"
#         f"  - cart: Navigate to URL, login, add at least one product to cart.\n"
#         f"  - checkout_info: Navigate to URL, login, add at least one product to cart, go to cart, click checkout.\n"
#         f"  - checkout_overview: Navigate to URL, login, add product, go to cart, click checkout, fill checkout info, click continue.\n"
#         f"\n"
#         f"⚠️ DO NOT SKIP these prerequisite steps, always clearly include them at the beginning of each test function.\n"
#         f"⚠️ Ensure each test function fully tests the listed methods for the corresponding page after reaching it.\n"
#         f"\n"
#         f"Name each test function as follows:\n"
#         f"- `test_positive_<page_name>_flow`\n"
#         f"- `test_negative_<page_name>_flow`\n"
#         f"- `test_edge_<page_name>_flow`\n"
#         f"\n"
#         f"Use the 'page' object for all method calls (e.g., `fill_username(page, 'value')`).\n"
#         f"DO NOT generate imports, markdown, explanations, or extra text—output ONLY valid Python code.\n"
#         f"\n"
#         f"Site URL: {site_url}\n\n"
#         f"📄 Page Object Methods:\n{page_method_section}\n\n"
#         f"💡 Additional Hints:\n{dynamic_steps_joined}\n\n"
#         f"Generate the code for all three test cases for each page below."
#     )

