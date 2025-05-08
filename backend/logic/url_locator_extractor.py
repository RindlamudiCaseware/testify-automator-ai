from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from urllib.parse import urlparse
from datetime import datetime
import uuid

def sanitize_metadata(record: dict) -> dict:
    sanitized = {}
    for k, v in record.items():
        if v is None:
            sanitized[k] = ""  # replace None with empty string
        elif isinstance(v, (dict, list)):
            sanitized[k] = str(v)  # convert dict/list to string
        else:
            sanitized[k] = v
    return sanitized

async def process_url_and_update_chroma(url: str, chroma_collection=None, embedding_function=None) -> list[dict]:
    element_metadata = []

    parsed_url = urlparse(url)
    domain_prefix = parsed_url.hostname.split('.')[0]
    page_base = parsed_url.path.strip("/").replace("/", "_").replace(".html", "") or "home"
    page_name = f"{domain_prefix}_{page_base}" if page_base != "home" else f"{domain_prefix}_login"

    snapshot_id = f"{page_name}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    print(f"📝 [DEBUG] Processing URL: {url}")
    print(f"📝 [DEBUG] Extracted page_name: {page_name}")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto(url)
            await page.wait_for_load_state("networkidle")
            html = await page.content()
        except Exception as e:
            print(f"❌ [ERROR] Failed to load {url}: {e}")
            await browser.close()
            return []

        soup = BeautifulSoup(html, "html.parser")

        for tag in soup.find_all(["button", "input", "a", "label"]):
            tag_name = tag.name

            label_text = (
                tag.get("aria-label") or
                tag.get("placeholder") or
                tag.get("alt") or
                tag.get("name") or
                tag.get_text(strip=True) or
                ""
            ).strip()

            element_id = f"{tag_name}_{label_text or str(uuid.uuid4())}"
            selector = f"#{tag.get('id')}" if tag.get("id") else None
            role = tag.get("role")
            name = tag.get("aria-label") or tag.get("name") or label_text

            try:
                pw_selector = selector if selector else f"{tag_name}:has-text(\"{label_text}\")"
                locator = page.locator(pw_selector)
                box = await locator.bounding_box() or {}
            except Exception:
                box = {}

            document_content = str(tag)
            record = {
                "element_id": element_id,
                "page_name": page_name,
                "intent": tag_name + "_" + (label_text or element_id),
                "tag": tag_name,
                "label_text": label_text,
                "css_selector": selector,
                "get_by_text": label_text if tag_name in ["button", "a", "label"] else None,
                "get_by_role": {"role": role, "name": name} if role else None,
                "xpath": f"//{tag_name}[contains(text(), '{label_text}')]" if label_text else None,
                "x": box.get("x", 0),
                "y": box.get("y", 0),
                "width": box.get("width", 0),
                "height": box.get("height", 0),
                "position_relation": {},
                "html_snippet": document_content,
                "confidence_score": 1.0,
                "visibility_score": 1.0,
                "locator_stability_score": 1.0,
                "snapshot_id": snapshot_id,
                "timestamp": datetime.utcnow().isoformat(),
                "source_url": url,
                "used_in_tests": [],
                "last_tested": None,
                "healing_success_rate": 0.0
            }
            element_metadata.append(record)

            print(f"   🏷️  [DEBUG] Extracted locator for tag: {tag_name}, label: '{label_text}', page_name: {page_name}")

            if chroma_collection:
                embedding = None
                if embedding_function:
                    try:
                        embedding = embedding_function([document_content])[0]
                    except Exception as emb_err:
                        print(f"⚠️ [EMBEDDING] Failed: {emb_err}")

                try:
                    sanitized_record = sanitize_metadata(record)
                    embedding_vector = embedding.tolist() if embedding is not None else None
                    chroma_collection.upsert(
                        ids=[element_id],
                        documents=[document_content],
                        metadatas=[sanitized_record],
                        embeddings=[embedding_vector] if embedding_vector else None
                    )

                    print(f"✅ [CHROMA] Upserted locator {element_id} into ChromaDB.")
                except Exception as insert_err:
                    print(f"❌ [CHROMA] Failed to upsert {element_id}: {insert_err}")

        await browser.close()

    print(f"✅ [DEBUG] Total locators extracted from {url}: {len(element_metadata)}")
    return element_metadata
