// SelfHealingLocator.ts

import { Page, Locator } from '@playwright/test';
import { Logger } from '../utils/logger';
import { waitForCondition } from '../utils/waitForCondition';
import { compareSignatures } from '../utils/mathUtils';
import { getSignature  } from '../locators/signatureStore';
import { ElementSignature } from '../types';

// If you need to disable self-healing globally, set this to false
const ENABLE_SELF_HEALING_FALLBACK = true;

/**
 * Options-based approach for advanced locators. 
 * If you prefer the legacy approach (just pass a string + fallbackKey),
 * that is still supported. 
 */
export interface HealerOptions {
  // ============ Priority #1: Playwright getBy* locators ============
  role?: string;          // e.g. 'button', 'textbox'
  roleName?: string;      // e.g. { name: 'Sign in' }
  text?: string;
  label?: string;
  placeholder?: string;
  altText?: string;
  title?: string;
  testId?: string;

  // ============ Priority #2: stable CSS / data-test-based selector ============
  stableCss?: string;     // e.g. '#login-btn' or '[data-test="mySelector"]'

  // ============ Priority #3: signature-based fallback ============
  fallbackSignatureKey?: string;

  // Timeout for each step (default 4000ms)
  timeoutMs?: number;
}

export class SelfHealingLocator {
  constructor(private page: Page, private pageName: string) {
    Logger.info(`[SelfHealingLocator] Initialized for page: "${this.pageName}"`);
  }

  /**
   * Main entry point. 
   * - If the user passes a string for `optionsOrPrimarySelector`, 
   *   we do the "legacy" approach: try that CSS, then fallback to signature. 
   * - Otherwise, we parse the advanced HealerOptions.
   */
  public async find(
    optionsOrPrimarySelector: string | HealerOptions,
    fallbackKey?: string
  ): Promise<Locator> {
    // Legacy approach
    if (typeof optionsOrPrimarySelector === 'string') {
      return this.findLegacy(optionsOrPrimarySelector, fallbackKey);
    }

    // Options-based approach
    const {
      role,
      roleName,
      text,
      label,
      placeholder,
      altText,
      title,
      testId,
      stableCss,
      fallbackSignatureKey,
      timeoutMs = 4000,
    } = optionsOrPrimarySelector;

    // 1) Attempt advanced Playwright locators
    const loc = await this.tryPlaywrightLocators(
      { role, roleName, text,label, placeholder, altText, title, testId },
      timeoutMs
    );
    if (loc) return loc;

    // 2) Attempt stable CSS if provided
    if (stableCss) {
      try {
        await waitForCondition(async () => {
          const handle = await this.page.$(stableCss);
          return !!handle;
        }, timeoutMs, 5000);

        // Double-check if there's exactly 1 match to avoid ambiguous test
        const count = await this.page.locator(stableCss).count();
        if (count !== 1) {
          throw new Error(
            `stableCss="${stableCss}" matched ${count} elements, expected exactly 1.`
          );
        }

        Logger.info(`Found element via stableCss="${stableCss}" with exactly 1 match.`);
        const singleLocator = this.page.locator(stableCss).first();
        await singleLocator.waitFor({ state: 'visible', timeout: timeoutMs });
        return singleLocator;
      } catch (err) {
        Logger.warn(`stableCss="${stableCss}" not found or was ambiguous. ${err}`);
      }
    }

    // 3) Signature-based fallback
    if (!ENABLE_SELF_HEALING_FALLBACK) {
      throw new Error(`[SelfHealingLocator] All locators + stableCss failed; fallback is disabled.`);
    }

    const key = fallbackSignatureKey || stableCss || 'unknownKey';
    Logger.info(`[SelfHealingLocator] Attempting signature fallback with key="${key}"...`);
    return this.signatureFallback(key, timeoutMs);
  }

  /**
   * "Legacy" approach: user calls find('#login-btn', 'loginbutton').
   * - We try the primarySelector. 
   * - If it fails, we do signature fallback if fallbackKey is provided (or just the same string).
   */
  private async findLegacy(primarySelector: string, fallbackSignatureKey?: string): Promise<Locator> {
    try {
      // Wait until there's exactly 1 match for the CSS
      await waitForCondition(async () => {
        const handle = await this.page.$(primarySelector);
        return !!handle;
      }, 4000, 500);

      const count = await this.page.locator(primarySelector).count();
      if (count !== 1) {
        throw new Error(
          `Primary selector="${primarySelector}" matched ${count} elements, expected exactly 1.`
        );
      }

      Logger.info(`Found element using primary selector="${primarySelector}" (exactly 1).`);
      const singleLocator = this.page.locator(primarySelector).first();
      await singleLocator.waitFor({ state: 'visible', timeout: 4000 });
      return singleLocator;
    } catch (err) {
      Logger.warn(`Primary selector="${primarySelector}" failed. ${err}`);
    }

    // Fallback
    if (!ENABLE_SELF_HEALING_FALLBACK) {
      throw new Error(
        `[SelfHealingLocator] CSS="${primarySelector}" not found; fallback disabled.`
      );
    }
    const key = fallbackSignatureKey || primarySelector;
    Logger.info(`[SelfHealingLocator] Attempting signature fallback with key="${key}"...`);
    return this.signatureFallback(key, 4000);
  }

  /**
   * Try each "recommended" Playwright locator in turn, ensuring exactly 1 match each time.
   */
  private async tryPlaywrightLocators(
    opts: {
      role?: string;
      roleName?: string;
      text?: string;
      tab?: string;
      label?: string;
      placeholder?: string;
      altText?: string;
      title?: string;
      testId?: string;
    },
    timeoutMs: number
  ): Promise<Locator | null> {
    const { role, roleName, text, label, placeholder, altText, title, testId } = opts;

    // Helper to ensure exactly 1 match
    const waitForSingleMatch = async (l: Locator, debugName: string): Promise<Locator> => {
      const count = await l.count();
      if (count !== 1) {
        throw new Error(`${debugName} => found ${count} elements, expected exactly 1`);
      }
      const singleLoc = l.first();
      await singleLoc.waitFor({ state: 'visible', timeout: timeoutMs });
      return singleLoc;
    };

    // 1) getByRole
    if (role) {
      try {
        let loc = roleName
          ? this.page.getByRole(role as any, { name: roleName })
          : this.page.getByRole(role as any);

        const single = await waitForSingleMatch(
          loc,
          `getByRole("${role}", name="${roleName ?? ''}")`
        );
        Logger.info(`getByRole("${role}", name="${roleName ?? ''}") => exactly 1 match.`);
        return single;
      } catch (error) {
        Logger.warn(`getByRole("${role}", name="${roleName ?? ''}") failed: ${error}`);
      }
    }

    // 2) getByText
    if (text) {
      try {
        const loc = this.page.getByText(text);
        const single = await waitForSingleMatch(loc, `getByText("${text}")`);
        Logger.info(`getByText("${text}") => exactly 1 match.`);
        return single;
      } catch (error) {
        Logger.warn(`getByText("${text}") failed: ${error}`);
      }
    }

    // 3) getByLabel
    if (label) {
      try {
        const loc = this.page.getByLabel(label);
        const single = await waitForSingleMatch(loc, `getByLabel("${label}")`);
        Logger.info(`getByLabel("${label}") => exactly 1 match.`);
        return single;
      } catch (error) {
        Logger.warn(`getByLabel("${label}") failed: ${error}`);
      }
    }

    // 4) getByPlaceholder
    if (placeholder) {
      try {
        const loc = this.page.getByPlaceholder(placeholder);
        const single = await waitForSingleMatch(loc, `getByPlaceholder("${placeholder}")`);
        Logger.info(`getByPlaceholder("${placeholder}") => exactly 1 match.`);
        return single;
      } catch (error) {
        Logger.warn(`getByPlaceholder("${placeholder}") failed: ${error}`);
      }
    }

    // 5) getByAltText
    if (altText) {
      try {
        const loc = this.page.getByAltText(altText);
        const single = await waitForSingleMatch(loc, `getByAltText("${altText}")`);
        Logger.info(`getByAltText("${altText}") => exactly 1 match.`);
        return single;
      } catch (error) {
        Logger.warn(`getByAltText("${altText}") failed: ${error}`);
      }
    }

    // 6) getByTitle
    if (title) {
      try {
        const loc = this.page.getByTitle(title);
        const single = await waitForSingleMatch(loc, `getByTitle("${title}")`);
        Logger.info(`getByTitle("${title}") => exactly 1 match.`);
        return single;
      } catch (error) {
        Logger.warn(`getByTitle("${title}") failed: ${error}`);
      }
    }

    // 7) getByTestId
    if (testId) {
      try {
        const loc = this.page.getByTestId(testId);
        const single = await waitForSingleMatch(loc, `getByTestId("${testId}")`);
        Logger.info(`getByTestId("${testId}") => exactly 1 match.`);
        return single;
      } catch (error) {
        Logger.warn(`getByTestId("${testId}") failed: ${error}`);
      }
    }

    return null; // None of the advanced locators succeeded
  }

  /**
   * The final fallback: signature-based healing. 
   * We find all elements matching the known tagName, compareSignatures, pick the best match.
   */
  private async signatureFallback(signatureKey: string, timeoutMs: number): Promise<Locator> {
    const knownSignature = getSignature(this.pageName, signatureKey);
    if (!knownSignature) {
      throw new Error(`No stored signature for key="${signatureKey}" in page="${this.pageName}".`);
    }

    const tagName = knownSignature.tagName || 'div';
    await waitForCondition(async () => {
      const found = await this.page.$$(tagName);
      return found.length > 0;
    }, timeoutMs, 500);

    const candidates = await this.page.$$(tagName);
    if (!candidates.length) {
      throw new Error(
        `No DOM candidates found for self-healing with tag="${tagName}" (key="${signatureKey}")`
      );
    }

    let bestHandle: any = null;
    let bestScore = 0;
    for (const handle of candidates) {
      const candidateSig = await this.buildSignature(handle, knownSignature);
      if (!candidateSig) continue;
      const similarity = compareSignatures(knownSignature, candidateSig);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestHandle = handle;
      }
    }

    if (!bestHandle || bestScore < 0.7) {
      throw new Error(
        `No sufficiently similar element found to self-heal key="${signatureKey}". bestScore=${bestScore}`
      );
    }

    Logger.info(
      `Signature fallback: success for key="${signatureKey}", similarity=${bestScore.toFixed(2)}.`
    );

    // Attempt a recommended locator (e.g., getByRole, getByLabel)
    const recommended = await this.buildRecommendedLocator(bestHandle, knownSignature);
    if (recommended) return recommended;

    // Otherwise fallback to ID, data-test, partial text, etc.
    return this.buildFallbackLocator(bestHandle, knownSignature);
  }

  /**
   * Build a signature from a candidate handle, so we can compare or refine locators.
   */
  public async buildSignature(
    elementHandle: any,
    knownSig: ElementSignature
  ): Promise<ElementSignature | null> {
    try {
      const tagName = await elementHandle.evaluate((e: HTMLElement) => e.tagName.toLowerCase());
      const id = await elementHandle.getAttribute('id');
      const className = await elementHandle.getAttribute('class');
      const classList = className ? className.split(/\s+/).filter(Boolean) : [];
      const textContent = await elementHandle.textContent();
      const textTokens = textContent ? textContent.trim().split(/\s+/) : [];
      const type = await elementHandle.getAttribute('type');
      const placeholder = await elementHandle.getAttribute('placeholder');
      const alt = await elementHandle.getAttribute('alt');
      const title = await elementHandle.getAttribute('title');
      const dataTestId = await elementHandle.getAttribute('data-testid');
      const ariaLabel = await elementHandle.getAttribute('aria-label');
      const role = await elementHandle.getAttribute('role');
      const value = await elementHandle.getAttribute('value');

      return {
        // originalSelector is the fallback key
        originalSelector: knownSig.originalSelector,
        tagName,
        id,
        classList,
        textTokens,
        type,
        placeholder,
        alt,
        title,
        dataTestId,
        ariaLabel,
        role,
        value,
      };
    } catch (err) {
      Logger.error(`Error building candidate signature: ${err}`);
      return null;
    }
  }

  /**
   * Attempt a recommended locator from the final signature (like getByRole, getByPlaceholder, etc.).
   */
  private async buildRecommendedLocator(
    elementHandle: any,
    signature: ElementSignature
  ): Promise<Locator | null> {
    const { role, ariaLabel, placeholder, alt, title, dataTestId, textTokens, tagName, type, value } = signature;

    // If there's a role, try getByRole with the text as the name
    if (role) {
      const possibleName = textTokens?.join(' ');
      if (possibleName) {
        Logger.info(`Trying getByRole('${role}', { name: "${possibleName}" })`);
        return this.page.getByRole(role as any, { name: possibleName });
      }
      Logger.info(`Trying getByRole('${role}') w/o name`);
      return this.page.getByRole(role as any);
    }

    // If it's an input[type=submit], we might do getByRole('button', { name: value })
    if (tagName === 'input' && type && type.toLowerCase() === 'submit') {
      if (value) {
        Logger.info(
          `Heuristic: input[type=submit][value="${value}"] => getByRole('button', { name: "${value}" })`
        );
        return this.page.getByRole('button', { name: value });
      }
      return this.page.getByRole('button');
    }

    if (ariaLabel) {
      Logger.info(`Trying getByLabel('${ariaLabel}')`);
      return this.page.getByLabel(ariaLabel);
    }
    if (placeholder) {
      Logger.info(`Trying getByPlaceholder('${placeholder}')`);
      return this.page.getByPlaceholder(placeholder);
    }
    if (alt) {
      Logger.info(`Trying getByAltText('${alt}')`);
      return this.page.getByAltText(alt);
    }
    if (title) {
      Logger.info(`Trying getByTitle('${title}')`);
      return this.page.getByTitle(title);
    }
    if (dataTestId) {
      Logger.info(`Trying getByTestId('${dataTestId}')`);
      return this.page.getByTestId(dataTestId);
    }
    if (textTokens && textTokens.length > 0) {
      const partialText = textTokens.slice(0, 5).join(' ');
      Logger.info(`Trying getByText('${partialText}')`);
      return this.page.getByText(partialText);
    }

    return null; // No recommended approach
  }

  /**
   * If recommended locator is unavailable, fallback to ID, data-test, partial text in an Xpath, etc.
   */
  private async buildFallbackLocator(
    elementHandle: any,
    signature: ElementSignature
  ): Promise<Locator> {
    const candidateId = await elementHandle.getAttribute('id');
    if (candidateId) {
      Logger.info(`Fallback using ID: #${candidateId}`);
      return this.page.locator(`#${candidateId}`);
    }

    const candidateDataTest = await elementHandle.getAttribute('data-test');
    if (candidateDataTest) {
      Logger.info(`Fallback using data-test: [data-test="${candidateDataTest}"]`);
      return this.page.locator(`[data-test="${candidateDataTest}"]`);
    }

    // Partial text snippet
    const text = signature.textTokens?.join(' ') || '';
    if (text) {
      const snippet = text.slice(0, 20);
      Logger.info(`Fallback partial text snippet="${snippet}"`);
      return this.page.locator(`xpath=//${signature.tagName}[contains(., "${snippet}")]`);
    }

    throw new Error(
      `No suitable fallback for signature key="${signature.originalSelector}". TagName="${signature.tagName}"`
    );
  }
}
