# utils/prompt_utils.py
from typing import List


def build_prompt(story_block: str, method_map: dict, page_names: list[str], site_url: str, dynamic_steps: list[str]) -> str:
    page_method_section = "\n".join(
        f"# {p}:\n" + "\n".join(f"- def {m}" for m in method_map.get(p, [])) for p in page_names
    )
    dynamic_steps_joined = "\n".join(dynamic_steps)

    return (
        f"You are a senior QA automation engineer tasked to write comprehensive Python Playwright tests.\n"
        f"Given the following user stories: {story_block}\n"
        f"- Use ONLY the methods listed below from the Page Object Model (POM) files; "
        f"these methods have already been generated and imported.\n"
        f"- Do NOT define or generate any new functions or methods. Only CALL the existing POM methods.\n"
        f"- For each user story, generate three test cases: one **positive**, one **negative**, and one **edge case**.\n"
        f"- Do NOT include any explanations, markdown, comments, or function/method definitions—just raw executable Playwright Python test code.\n"
        f"- Site URL: {site_url}\n\n"
        f"Page Object Methods:\n{page_method_section}\n\n"
        f"Additional Hints:\n{dynamic_steps_joined}\n\n"
        f"Generate the code below."
    )
