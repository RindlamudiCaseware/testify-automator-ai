# utils/prompt_utils.py

from typing import List



# utils/prompt_utils.py
def build_prompt(story_block: str, method_map: dict, page_names: list[str], site_url: str, dynamic_steps: list[str]) -> str:
    page_method_section = "\n".join(
        f"# {p}:\n" + "\n".join(f"- def {m}" for m in method_map.get(p, [])) for p in page_names
    )
    dynamic_steps_joined = "\n".join(dynamic_steps)

    return (
        f"You are a senior QA automation engineer. Given the user stories: {story_block}, "
        f"use only the methods listed below (from Page Object Model files). "
        f"Do not define any functions or methods. Only use the ones already defined. "
        f"Do not explain or include markdown.\n\n"
        f"Site URL: {site_url}\n\n"
        f"Page Object Methods:\n{page_method_section}\n\n"
        f"Additional Hints:\n{dynamic_steps_joined}\n\n"
        f"Generate raw Python Playwright tests using only the available POM methods."
    )
