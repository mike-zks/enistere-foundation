import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_PACK_ATTRIBUTE,
  resolveWebTheme,
} from "../src/core/config/theme.js";

test("thème par défaut = light", () => {
  assert.equal(DEFAULT_THEME, "light");
});

test("attribut de thème = data-theme", () => {
  assert.equal(THEME_ATTRIBUTE, "data-theme");
  assert.equal(THEME_PACK_ATTRIBUTE, "data-enistere-theme");
});

test("résout le pack institutionnel et son contexte sans dépendre du framework API", () => {
  assert.deepEqual(resolveWebTheme({
    NEXT_PUBLIC_ENISTERE_INSTITUTION_ID: "sunrise",
    NEXT_PUBLIC_ENISTERE_THEME_CONTEXT: "learning",
    NEXT_PUBLIC_ENISTERE_THEME_MODE: "dark",
  }), {
    "data-theme": "dark",
    "data-enistere-theme": "sunrise-institute",
    "data-theme-context": "learning",
  });
});

test("retombe sur le pack Enistere pour une institution inconnue", () => {
  assert.equal(resolveWebTheme({ NEXT_PUBLIC_ENISTERE_INSTITUTION_ID: "unknown" })["data-enistere-theme"], "enistere-default");
});
